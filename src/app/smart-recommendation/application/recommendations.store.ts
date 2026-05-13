import { computed, inject, Injectable, signal } from '@angular/core';
import { filter, firstValueFrom } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { RecommendationsApi, RecommendationCard } from '../infrastructure/recommendations-api';
import { WeatherContext } from '../domain/model/weather-context.entity';
import { TravelContext } from '../domain/model/travel-context.entity';
import { RecommendationSession } from '../domain/model/recommendation-session.entity';
import { AdherenceStatus } from '../domain/model/adherence-status.enum';
import { IamStore } from '../../iam/application/iam.store';
import { BehavioralConsistencyStore } from '../../behavioral-consistency/application/behavioral-consistency.store';
import { DomainEventBus } from '../../shared/application/domain-event-bus';
import { BehavioralDropDetected } from '../../shared/domain/behavioral-drop-detected.event';
import { ConsistencyRecovered } from '../../shared/domain/consistency-recovered.event';
import { NutritionalAbandonmentRisk } from '../../shared/domain/nutritional-abandonment-risk.event';
import { StrategyMismatchDetected } from '../../shared/domain/strategy-mismatch-detected.event';
import { StagnationDetected } from '../../shared/domain/stagnation-detected.event';
import { BenefitsEnabled } from '../../shared/domain/benefits-enabled.event';
import { BenefitsDisabled } from '../../shared/domain/benefits-disabled.event';
import { CompatibleDishesRanked } from '../../shared/domain/compatible-dishes-ranked.event';
import { ContextualTargetAdjusted } from '../../shared/domain/contextual-target-adjusted.event';
import { ContextualTargetAdjustment } from '../domain/model/contextual-target-adjustment.value-object';
import { NotificationService } from '../../shared/application/notification.service';

@Injectable({ providedIn: 'root' })
export class RecommendationsStore {
  private api                 = inject(RecommendationsApi);
  private iamStore            = inject(IamStore);
  private bcStore             = inject(BehavioralConsistencyStore);
  private eventBus            = inject(DomainEventBus);
  private translate           = inject(TranslateService);
  private notificationService = inject(NotificationService);

  constructor() {
    this.subscribeToAdherenceEvents();
    this.subscribeToBillingEvents();
    this.subscribeToLangChange();
  }

  // ─── Private Signals ──────────────────────────────────────────────────────

  private _weatherContext   = signal<WeatherContext | null>(null);
  private _travelContext    = signal<TravelContext | null>(null);
  private _unrecognizedCity = signal<boolean>(false);
  private _session          = signal<RecommendationSession | null>(null);
  private _weatherCards     = signal<RecommendationCard[]>([]);
  private _travelCards      = signal<RecommendationCard[]>([]);
  private _preventiveCard   = signal<RecommendationCard | null>(null);
  private _interventionCard = signal<RecommendationCard | null>(null);
  private _bestDishCard     = signal<RecommendationCard | null>(null);
  private _loading            = signal<boolean>(false);
  private _locationDenied     = signal<boolean>(false);
  private _error              = signal<string | null>(null);
  private _availableLocations = signal<WeatherContext[]>([]);
  private _demoTemperature    = signal<number | null>(null);
  private _homeCity           = signal<string>('Lima');

  // ─── Public Read-only Signals ─────────────────────────────────────────────

  readonly weatherContext   = this._weatherContext.asReadonly();
  readonly travelContext    = this._travelContext.asReadonly();
  readonly session          = this._session.asReadonly();
  readonly weatherCards     = this._weatherCards.asReadonly();
  readonly travelCards      = this._travelCards.asReadonly();
  readonly preventiveCard   = this._preventiveCard.asReadonly();
  readonly interventionCard = this._interventionCard.asReadonly();
  /** Best dish recommended after a menu analysis — populated by {@link CompatibleDishesRanked}. */
  readonly bestDishCard     = this._bestDishCard.asReadonly();
  readonly loading            = this._loading.asReadonly();
  readonly locationDenied     = this._locationDenied.asReadonly();
  readonly unrecognizedCity   = this._unrecognizedCity.asReadonly();
  readonly error              = this._error.asReadonly();
  readonly availableLocations = this._availableLocations.asReadonly();
  readonly demoTemperature    = this._demoTemperature.asReadonly();

  // ─── Computed Signals ─────────────────────────────────────────────────────

  readonly isTravelMode = computed(() => this._travelContext()?.isTravelActive() ?? false);

  /** Calorie target for the active session after contextual adjustment (travel or weather). */
  readonly adjustedKcalTarget = computed(() => this._session()?.adjustedKcalTarget ?? 0);

  readonly showPreventiveCard = computed(() =>
    this._session()?.requiresPreventiveRecommendation() ?? false
  );

  readonly showInterventionCard = computed(() =>
    this._session()?.requiresInterventionRecommendation() ?? false
  );

  readonly activeCards = computed(() =>
    this.isTravelMode() ? this._travelCards() : this._weatherCards()
  );

  readonly activeFilters = computed(() =>
    this.iamStore.currentUser()?.restrictions ?? []
  );

  // ─── Actions ──────────────────────────────────────────────────────────────

  async initialise(): Promise<void> {
    const user = this.iamStore.currentUser();
    if (!user) return;

    this._loading.set(true);
    this._error.set(null);

    try {
      const userId   = String(user.id);
      const homeCity = user.homeCity ?? '';

      const [snapshot, existingTravel, session, locations] = await Promise.all([
        firstValueFrom(this.api.getLatestLocationSnapshot(userId)),
        firstValueFrom(this.api.getTravelContext(userId)),
        firstValueFrom(this.api.getRecommendationSession(userId)),
        firstValueFrom(this.api.getAvailableLocations()),
      ]);
      this._availableLocations.set(locations);

      this._session.set(session ?? new RecommendationSession({
        id: 0, userId: user.id, adherenceStatus: AdherenceStatus.ON_TRACK,
        consecutiveMisses: 0, simplifiedKcalTarget: Math.round((user.dailyCalorieTarget ?? 1800) * 0.78),
        createdAt: new Date().toISOString(), isActive: true,
      }));

      const isAway = snapshot !== null && !snapshot.isHome(homeCity);
      const city   = isAway ? snapshot!.city    : homeCity || 'Lima';
      const country = isAway ? snapshot!.country : 'Peru';
      this._homeCity.set(homeCity || 'Lima');

      if (isAway) {
        const travel = existingTravel ?? new TravelContext({
          id: 0, city, country, isActive: true, isManual: false, activatedAt: new Date().toISOString(),
        });
        travel.activate(city, country, false);
        this._travelContext.set(travel);
        const travelCards = await firstValueFrom(this.api.getTravelRecommendations(this.resolveCityId(city)));
        if (travelCards.length === 0) {
          this._unrecognizedCity.set(true);
        } else {
          this._travelCards.set(travelCards);
        }
      } else {
        if (existingTravel) existingTravel.deactivate();
        this._travelContext.set(existingTravel ?? new TravelContext({
          id: 0, city: '', country: '', isActive: false, isManual: false, activatedAt: '',
        }));
      }

      const weather = await firstValueFrom(this.api.getCurrentWeather(city));
      this._weatherContext.set(weather);

      if (weather) {
        const weatherCards = await firstValueFrom(this.api.getWeatherRecommendations(weather.weatherType));
        this._weatherCards.set(weatherCards);
      }

      await this.syncAdherenceFromBehavioralContext(user.id, userId);

      const travelCtx = this._travelContext();
      if (travelCtx?.isTravelActive()) {
        this.applyAdjustmentToSession(travelCtx.calorieAdjustmentFactor());
      } else if (weather) {
        this.applyAdjustmentToSession(weather.calorieAdjustmentFactor());
      }
    } catch {
      this._error.set('recommendations.error_load_failed');
    } finally {
      this._loading.set(false);
    }
  }

  private async syncAdherenceFromBehavioralContext(userId: number, userIdStr: string): Promise<void> {
    await firstValueFrom(this.bcStore.ensureProgressForUser(userId));
    const bcStatus = this.bcStore.adherenceStatus() as string as AdherenceStatus | null;
    if (!bcStatus || bcStatus === AdherenceStatus.ON_TRACK) return;

    const session = await firstValueFrom(this.api.getStrategyAdjustment(bcStatus, userIdStr));
    this._session.set(session);

    if (session.requiresPreventiveRecommendation()) {
      const card = await firstValueFrom(this.api.getPreventiveRecommendation());
      this._preventiveCard.set(card);
    } else if (session.requiresInterventionRecommendation()) {
      const card = await firstValueFrom(this.api.getInterventionRecommendation());
      this._interventionCard.set(card);
    }
  }

  async setAdherenceStatus(status: AdherenceStatus): Promise<void> {
    const userId = String(this.iamStore.currentUser()?.id ?? '1');
    this._loading.set(true);
    this._error.set(null);
    try {
      const session = await firstValueFrom(this.api.getStrategyAdjustment(status, userId));
      this._session.set(session);

      if (session.requiresPreventiveRecommendation()) {
        const card = await firstValueFrom(this.api.getPreventiveRecommendation());
        this._preventiveCard.set(card);
        this._interventionCard.set(null);
      } else if (session.requiresInterventionRecommendation()) {
        const card = await firstValueFrom(this.api.getInterventionRecommendation());
        this._interventionCard.set(card);
        this._preventiveCard.set(null);
      } else {
        this._preventiveCard.set(null);
        this._interventionCard.set(null);
      }
    } catch {
      this._error.set('recommendations.error_load_failed');
    } finally {
      this._loading.set(false);
    }
  }

  async activateTravelMode(city: string, country: string, manual: boolean = false): Promise<void> {
    const userId = String(this.iamStore.currentUser()?.id ?? '1');
    this._loading.set(true);
    this._unrecognizedCity.set(false);
    this._error.set(null);
    try {
      const ctx = await firstValueFrom(this.api.activateTravelMode(city, country, userId));
      ctx.isManual = manual;
      this._travelContext.set(ctx);
      this._demoTemperature.set(null);

      const [cards, weather] = await Promise.all([
        firstValueFrom(this.api.getTravelRecommendations(this.resolveCityId(city))),
        firstValueFrom(this.api.getCurrentWeather(city)),
      ]);
      if (weather) this._weatherContext.set(weather);
      if (cards.length === 0) {
        this._unrecognizedCity.set(true);
        this._travelCards.set([]);
      } else {
        this._travelCards.set(cards);
      }

      this.applyAdjustmentToSession(ctx.calorieAdjustmentFactor());
    } catch {
      this._error.set('recommendations.error_load_failed');
    } finally {
      this._loading.set(false);
    }
  }

  async deactivateTravelMode(): Promise<void> {
    const userId = String(this.iamStore.currentUser()?.id ?? '1');
    this._loading.set(true);
    this._unrecognizedCity.set(false);
    this._error.set(null);
    try {
      const ctx = await firstValueFrom(this.api.deactivateTravelMode(userId));
      this._travelContext.set(ctx);
      this._travelCards.set([]);
      this._demoTemperature.set(null);
      const weather = await firstValueFrom(this.api.getCurrentWeather(this._homeCity()));
      if (weather) {
        this._weatherContext.set(weather);
        this.applyAdjustmentToSession(weather.calorieAdjustmentFactor());
      }
    } catch {
      this._error.set('recommendations.error_load_failed');
    } finally {
      this._loading.set(false);
    }
  }

  setDemoTemperature(temp: number | null): void {
    this._demoTemperature.set(temp);
  }

  denyLocation(): void {
    this._locationDenied.set(true);
  }

  allowLocation(): void {
    this._locationDenied.set(false);
  }

  /**
   * Applies a contextual calorie adjustment to the active session and
   * publishes {@link ContextualTargetAdjusted} when the factor differs from 1.
   *
   * Travel adjustment takes precedence over weather when both are active.
   *
   * @param adjustment - Adjustment derived from the active travel or weather context.
   */
  private applyAdjustmentToSession(adjustment: ContextualTargetAdjustment): void {
    const session = this._session();
    const user    = this.iamStore.currentUser();
    if (!session || !user) return;

    session.applyContextualAdjustment(adjustment);
    this._session.set(session);

    if (adjustment.isActive()) {
      this.eventBus.publish(new ContextualTargetAdjusted(
        user.id,
        adjustment.source,
        adjustment.factor,
        session.simplifiedKcalTarget,
        session.adjustedKcalTarget,
      ));
    }
  }

  /** Resolves a city name to its weather-snapshot ID for querying recommendation-cards. */
  private resolveCityId(cityName: string): string {
    const match = this._availableLocations().find(l => l.city === cityName);
    return match?.snapshotId ?? cityName;
  }

  private subscribeToBillingEvents(): void {
    this.eventBus.events$
      .pipe(filter(e => e instanceof BenefitsEnabled))
      .subscribe(async () => {
        await this.initialise();
      });

    this.eventBus.events$
      .pipe(filter(e => e instanceof BenefitsDisabled))
      .subscribe(() => {
        this._travelCards.set([]);
        this._weatherCards.set([]);
        this._bestDishCard.set(null);
      });
  }

  private subscribeToLangChange(): void {
    this.translate.onLangChange.subscribe(() => {
      if (this.iamStore.currentUser()) {
        void this.initialise();
      }
    });
  }

  private subscribeToAdherenceEvents(): void {
    this.eventBus.events$
      .pipe(filter(e => e instanceof BehavioralDropDetected))
      .subscribe(async () => {
        await this.setAdherenceStatus(AdherenceStatus.AT_RISK);
      });

    this.eventBus.events$
      .pipe(filter(e => e instanceof NutritionalAbandonmentRisk))
      .subscribe(async () => {
        await this.setAdherenceStatus(AdherenceStatus.DROPPED);
      });

    this.eventBus.events$
      .pipe(filter(e => e instanceof ConsistencyRecovered))
      .subscribe(async () => {
        await this.setAdherenceStatus(AdherenceStatus.ON_TRACK);
      });

    this.eventBus.events$
      .pipe(filter(e => e instanceof StrategyMismatchDetected))
      .subscribe(async () => {
        await this.setAdherenceStatus(AdherenceStatus.AT_RISK);
      });

    this.eventBus.events$
      .pipe(filter(e => e instanceof StagnationDetected))
      .subscribe(async () => {
        this.notificationService.notify('warning', 'notifications.strategy_adjustment');
        await this.setAdherenceStatus(AdherenceStatus.AT_RISK);
      });

    this.eventBus.events$
      .pipe(filter(e => e instanceof CompatibleDishesRanked))
      .subscribe((e) => {
        const event = e as CompatibleDishesRanked;
        this._bestDishCard.set({
          id:          `best-dish-${event.occurredAt}`,
          name:        event.bestDishName,
          description: `${event.bestDishCalories} kcal · P${event.bestDishProtein}g · C${event.bestDishCarbs}g · G${event.bestDishFat}g`,
          kcal:        event.bestDishCalories,
          protein:     `${event.bestDishProtein}g`,
          badge:       'restaurant',
        });
      });
  }
}
