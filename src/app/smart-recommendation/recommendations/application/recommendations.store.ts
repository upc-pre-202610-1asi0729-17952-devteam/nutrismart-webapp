import { computed, inject, Injectable, signal } from '@angular/core';
import { RecommendationsApi, RecommendationCard } from '../infrastructure/recommendations-api';
import { WeatherContext } from '../domain/model/weather-context.entity';
import { TravelContext } from '../domain/model/travel-context.entity';
import { RecommendationSession } from '../domain/model/recommendation-session.entity';
import { AdherenceStatus } from '../domain/model/adherence-status.enum';
import { WeatherType } from '../domain/model/weather-type.enum';
import { IamStore } from '../../../iam/application/iam.store';

/**
 * Central state store for the Smart Recommendation bounded context.
 *
 * Manages weather context, travel context, recommendation session state,
 * and recommendation card lists using Angular Signals. All write operations
 * delegate to {@link RecommendationsApi} mock methods and update signals
 * reactively.
 *
 * Provided in root so a single instance is shared across the application.
 *
 * @author Espinoza Cruz, Angela Milagros
 */
@Injectable({ providedIn: 'root' })
export class RecommendationsStore {
  private api      = inject(RecommendationsApi);
  private iamStore = inject(IamStore);

  // ─── Private Signals ──────────────────────────────────────────────────────

  private _weatherContext        = signal<WeatherContext | null>(null);
  private _travelContext         = signal<TravelContext | null>(null);
  private _unrecognizedCity      = signal<boolean>(false);
  private _session               = signal<RecommendationSession | null>(null);
  private _weatherCards          = signal<RecommendationCard[]>([]);
  private _travelCards           = signal<RecommendationCard[]>([]);
  private _preventiveCard        = signal<RecommendationCard | null>(null);
  private _interventionCard      = signal<RecommendationCard | null>(null);
  private _loading               = signal<boolean>(false);
  private _locationDenied        = signal<boolean>(false);

  // ─── Public Read-only Signals ─────────────────────────────────────────────

  /** Current weather context including temperature and city. */
  readonly weatherContext   = this._weatherContext.asReadonly();

  /** Current travel mode context. */
  readonly travelContext    = this._travelContext.asReadonly();

  /** Active recommendation session driving card strategy selection. */
  readonly session          = this._session.asReadonly();

  /** Weather-based recommendation cards for the current conditions. */
  readonly weatherCards     = this._weatherCards.asReadonly();

  /** Local dish recommendation cards for the travel city. */
  readonly travelCards      = this._travelCards.asReadonly();

  /** Preventive recommendation card shown when adherence is AT_RISK. */
  readonly preventiveCard   = this._preventiveCard.asReadonly();

  /** Intervention plan card shown when adherence is DROPPED. */
  readonly interventionCard = this._interventionCard.asReadonly();

  /** Whether an async operation is in flight. */
  readonly loading          = this._loading.asReadonly();

  /** Whether the user has denied location access. */
  readonly locationDenied   = this._locationDenied.asReadonly();

  /** Whether the last manual city entered was not recognized (no specific local dishes found). */
  readonly unrecognizedCity = this._unrecognizedCity.asReadonly();

  // ─── Computed Signals ─────────────────────────────────────────────────────

  /** Whether travel mode is currently active. */
  readonly isTravelMode = computed(() => this._travelContext()?.isTravelActive() ?? false);

  /** Whether to show the AT_RISK preventive card (above weather cards). */
  readonly showPreventiveCard = computed(() =>
    this._session()?.requiresPreventiveRecommendation() ?? false
  );

  /** Whether to show the DROPPED intervention card (above weather cards). */
  readonly showInterventionCard = computed(() =>
    this._session()?.requiresInterventionRecommendation() ?? false
  );

  /** Cards currently shown in the main recommendation list. */
  readonly activeCards = computed(() =>
    this.isTravelMode() ? this._travelCards() : this._weatherCards()
  );

  /** Active dietary restriction labels for the right-panel filter tags. */
  readonly activeFilters = computed(() =>
    (this.iamStore.currentUser()?.restrictions ?? []).map(r =>
      r.toString().replace(/_/g, '-').toLowerCase()
        .replace(/^\w/, (c: string) => c.toUpperCase())
    )
  );

  // ─── Actions ──────────────────────────────────────────────────────────────

  /**
   * Initialises the store: loads weather context and sets up a default
   * ON_TRACK recommendation session for the current user.
   *
   * @returns Promise that resolves once all initial data is loaded.
   */
  async initialise(): Promise<void> {
    this._loading.set(true);
    await new Promise<void>(resolve => {
      this.api.getCurrentWeather().subscribe(weather => {
        this._weatherContext.set(weather);
        this.api.getWeatherRecommendations(weather.weatherType).subscribe(cards => {
          this._weatherCards.set(cards);
          resolve();
        });
      });
    });

    const user = this.iamStore.currentUser();
    this._session.set(new RecommendationSession({
      id: 1,
      userId: user?.id ?? 0,
      adherenceStatus: AdherenceStatus.ON_TRACK,
      consecutiveMisses: 0,
      simplifiedKcalTarget: Math.round((user?.dailyCalorieTarget ?? 1800) * 0.78),
      createdAt: new Date().toISOString(),
      isActive: true,
    }));

    this._travelContext.set(new TravelContext({
      id: 1, city: '', country: '',
      isActive: false, isManual: false, activatedAt: '',
    }));

    this._loading.set(false);
  }

  /**
   * Switches weather type and reloads weather-based recommendation cards.
   * Used by the demo bar to toggle between HOT and COLD states.
   *
   * @param weatherType - Target weather type to simulate.
   */
  setWeatherType(weatherType: WeatherType): void {
    const current = this._weatherContext();
    if (!current) return;

    const updatedAt = new Date().toISOString();
    const isCold = weatherType === WeatherType.COLD;

    this._weatherContext.set(new WeatherContext({
      id: current.id,
      city: current.city,
      country: current.country,
      temperatureCelsius: isCold ? 12 : 31,
      condition: isCold ? 'Cloudy' : 'Sunny',
      weatherType,
      updatedAt,
    }));

    this._loading.set(true);
    this.api.getWeatherRecommendations(weatherType).subscribe(cards => {
      this._weatherCards.set(cards);
      this._loading.set(false);
    });
  }

  /**
   * Sets the adherence status on the active session and loads the
   * appropriate preventive or intervention recommendation card.
   *
   * Emits PreventiveRecommendationGenerated or InterventionRecommendationGenerated
   * domain event labels through the session entity methods.
   *
   * @param status - Target adherence status.
   */
  setAdherenceStatus(status: AdherenceStatus): void {
    this._loading.set(true);
    this.api.getStrategyAdjustment(status).subscribe(session => {
      this._session.set(session);

      if (session.requiresPreventiveRecommendation()) {
        this.api.getPreventiveRecommendation().subscribe(card => {
          this._preventiveCard.set(card);
          this._interventionCard.set(null);
          this._loading.set(false);
        });
      } else if (session.requiresInterventionRecommendation()) {
        this.api.getInterventionRecommendation().subscribe(card => {
          this._interventionCard.set(card);
          this._preventiveCard.set(null);
          this._loading.set(false);
        });
      } else {
        this._preventiveCard.set(null);
        this._interventionCard.set(null);
        this._loading.set(false);
      }
    });
  }

  /**
   * Activates travel mode for a given city, replacing weather cards with
   * local dish recommendations.
   *
   * @param city    - City name to activate travel mode for.
   * @param country - Country of the city.
   * @param manual  - Whether the city was entered manually by the user.
   */
  activateTravelMode(city: string, country: string, manual: boolean = false): void {
    this._loading.set(true);
    this._unrecognizedCity.set(false);
    this.api.activateTravelMode(city, country).subscribe(ctx => {
      ctx.isManual = manual;
      this._travelContext.set(ctx);
      this.api.getTravelRecommendations(city).subscribe(cards => {
        if (cards.length === 0) {
          // City not recognized — keep travel active but flag the state
          this._unrecognizedCity.set(true);
          this._travelCards.set([]);
        } else {
          this._travelCards.set(cards);
        }
        this._loading.set(false);
      });
    });
  }

  /**
   * Deactivates travel mode and restores weather-based recommendations.
   */
  deactivateTravelMode(): void {
    this._loading.set(true);
    this._unrecognizedCity.set(false);
    this.api.deactivateTravelMode().subscribe(ctx => {
      this._travelContext.set(ctx);
      this._travelCards.set([]);
      this._loading.set(false);
    });
  }

  /**
   * Marks location as denied so the view can show a manual city input fallback.
   */
  denyLocation(): void {
    this._locationDenied.set(true);
  }

  /**
   * Resets location denied state (e.g. after the user grants permission).
   */
  allowLocation(): void {
    this._locationDenied.set(false);
  }
}
