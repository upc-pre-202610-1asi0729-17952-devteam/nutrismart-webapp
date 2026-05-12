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
import { AdherenceStatus as BcAdherenceStatus } from '../../behavioral-consistency/domain/model/adherence-status.enum';
import { DomainEventBus } from '../../shared/application/domain-event-bus';
import { BehavioralDropDetected } from '../../shared/domain/behavioral-drop-detected.event';
import { ConsistencyRecovered } from '../../shared/domain/consistency-recovered.event';

@Injectable({ providedIn: 'root' })
export class RecommendationsStore {
  private api       = inject(RecommendationsApi);
  private iamStore  = inject(IamStore);
  private bcStore   = inject(BehavioralConsistencyStore);
  private eventBus  = inject(DomainEventBus);
  private translate = inject(TranslateService);

  constructor() {
    this.subscribeToAdherenceEvents();
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
  private _loading          = signal<boolean>(false);
  private _locationDenied   = signal<boolean>(false);
  private _error            = signal<string | null>(null);

  // ─── Public Read-only Signals ─────────────────────────────────────────────

  readonly weatherContext   = this._weatherContext.asReadonly();
  readonly travelContext    = this._travelContext.asReadonly();
  readonly session          = this._session.asReadonly();
  readonly weatherCards     = this._weatherCards.asReadonly();
  readonly travelCards      = this._travelCards.asReadonly();
  readonly preventiveCard   = this._preventiveCard.asReadonly();
  readonly interventionCard = this._interventionCard.asReadonly();
  readonly loading          = this._loading.asReadonly();
  readonly locationDenied   = this._locationDenied.asReadonly();
  readonly unrecognizedCity = this._unrecognizedCity.asReadonly();
  readonly error            = this._error.asReadonly();

  // ─── Computed Signals ─────────────────────────────────────────────────────

  readonly isTravelMode = computed(() => this._travelContext()?.isTravelActive() ?? false);

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

      const [snapshot, existingTravel, session] = await Promise.all([
        firstValueFrom(this.api.getLatestLocationSnapshot(userId)),
        firstValueFrom(this.api.getTravelContext(userId)),
        firstValueFrom(this.api.getRecommendationSession(userId)),
      ]);

      this._session.set(session ?? new RecommendationSession({
        id: 0, userId: user.id, adherenceStatus: AdherenceStatus.ON_TRACK,
        consecutiveMisses: 0, simplifiedKcalTarget: Math.round((user.dailyCalorieTarget ?? 1800) * 0.78),
        createdAt: new Date().toISOString(), isActive: true,
      }));

      const isAway = snapshot !== null && !snapshot.isHome(homeCity);
      const city   = isAway ? snapshot!.city    : homeCity || 'Lima';
      const country = isAway ? snapshot!.country : 'Peru';

      if (isAway) {
        const travel = existingTravel ?? new TravelContext({
          id: 0, city, country, isActive: true, isManual: false, activatedAt: new Date().toISOString(),
        });
        travel.activate(city, country, false);
        this._travelContext.set(travel);
        const travelCards = await firstValueFrom(this.api.getTravelRecommendations(city));
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
    } catch {
      this._error.set('recommendations.error_load_failed');
    } finally {
      this._loading.set(false);
    }
  }

  private async syncAdherenceFromBehavioralContext(userId: number, userIdStr: string): Promise<void> {
    await firstValueFrom(this.bcStore.ensureProgressForUser(userId));
    const bcStatus = this.bcStore.adherenceStatus();
    if (!bcStatus) return;

    const mapped = this.mapBcAdherenceStatus(bcStatus);
    if (mapped === AdherenceStatus.ON_TRACK) return;

    const session = await firstValueFrom(this.api.getStrategyAdjustment(mapped, userIdStr));
    this._session.set(session);

    if (session.requiresPreventiveRecommendation()) {
      const card = await firstValueFrom(this.api.getPreventiveRecommendation());
      this._preventiveCard.set(card);
    } else if (session.requiresInterventionRecommendation()) {
      const card = await firstValueFrom(this.api.getInterventionRecommendation());
      this._interventionCard.set(card);
    }
  }

  private mapBcAdherenceStatus(bcStatus: BcAdherenceStatus): AdherenceStatus {
    switch (bcStatus) {
      case BcAdherenceStatus.DROPPED:   return AdherenceStatus.DROPPED;
      case BcAdherenceStatus.AT_RISK:
      case BcAdherenceStatus.OFF_TRACK: return AdherenceStatus.AT_RISK;
      default:                          return AdherenceStatus.ON_TRACK;
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

      const cards = await firstValueFrom(this.api.getTravelRecommendations(city));
      if (cards.length === 0) {
        this._unrecognizedCity.set(true);
        this._travelCards.set([]);
      } else {
        this._travelCards.set(cards);
      }
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
    } catch {
      this._error.set('recommendations.error_load_failed');
    } finally {
      this._loading.set(false);
    }
  }

  denyLocation(): void {
    this._locationDenied.set(true);
  }

  allowLocation(): void {
    this._locationDenied.set(false);
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
      .subscribe(async (e) => {
        const event = e as BehavioralDropDetected;
        const status = event.consecutiveMisses >= 5 ? AdherenceStatus.DROPPED : AdherenceStatus.AT_RISK;
        await this.setAdherenceStatus(status);
      });

    this.eventBus.events$
      .pipe(filter(e => e instanceof ConsistencyRecovered))
      .subscribe(async () => {
        await this.setAdherenceStatus(AdherenceStatus.ON_TRACK);
      });
  }
}
