import { computed, inject, Injectable, signal } from '@angular/core';
import { RecommendationsApi, RecommendationCard } from '../infrastructure/recommendations-api';
import { WeatherContext } from '../domain/model/weather-context.entity';
import { TravelContext } from '../domain/model/travel-context.entity';
import { RecommendationSession } from '../domain/model/recommendation-session.entity';
import { AdherenceStatus } from '../domain/model/adherence-status.enum';
import { WeatherType } from '../domain/model/weather-type.enum';
import { IamStore } from '../../iam/application/iam.store';

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
    (this.iamStore.currentUser()?.restrictions ?? []).map(r =>
      r.toString().replace(/_/g, '-').toLowerCase()
        .replace(/^\w/, (c: string) => c.toUpperCase())
    )
  );

  // ─── Actions ──────────────────────────────────────────────────────────────

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

  activateTravelMode(city: string, country: string, manual: boolean = false): void {
    this._loading.set(true);
    this._unrecognizedCity.set(false);
    this.api.activateTravelMode(city, country).subscribe(ctx => {
      ctx.isManual = manual;
      this._travelContext.set(ctx);
      this.api.getTravelRecommendations(city).subscribe(cards => {
        if (cards.length === 0) {
          this._unrecognizedCity.set(true);
          this._travelCards.set([]);
        } else {
          this._travelCards.set(cards);
        }
        this._loading.set(false);
      });
    });
  }

  deactivateTravelMode(): void {
    this._loading.set(true);
    this._unrecognizedCity.set(false);
    this.api.deactivateTravelMode().subscribe(ctx => {
      this._travelContext.set(ctx);
      this._travelCards.set([]);
      this._loading.set(false);
    });
  }

  denyLocation(): void {
    this._locationDenied.set(true);
  }

  allowLocation(): void {
    this._locationDenied.set(false);
  }
}
