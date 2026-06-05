import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { forkJoin, Observable, throwError } from 'rxjs';
import { catchError, map, retry, switchMap } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
import { environment } from '../../../environments/environment.development';
import { BaseApi } from '../../shared/infrastructure/base-api';
import { LocationSnapshot } from '../domain/model/location-snapshot.entity';
import { WeatherContext } from '../domain/model/weather-context.entity';
import { TravelContext } from '../domain/model/travel-context.entity';
import { RecommendationSession } from '../domain/model/recommendation-session.entity';
import { AdherenceStatus } from '../domain/model/adherence-status.enum';
import { WeatherType } from '../domain/model/weather-type.enum';
import {
  LocationSnapshotResource,
  WeatherContextResource,
  TravelContextResource,
  RecommendationSessionResource,
  RecommendationCardResource,
  FoodCardResource,
} from './recommendations-resource';
import {
  LocationSnapshotAssembler,
  WeatherContextAssembler,
  TravelContextAssembler,
  RecommendationSessionAssembler,
} from './recommendations-assembler';

export interface RecommendationCard {
  id: number | string;
  /** Identifier of the underlying food item — used to log the card to the nutrition diary. */
  foodId: number | string;
  name: string;
  description: string;
  calories: number;
  protein: string;
  badge: string;
}

const BASE = environment.apiBaseUrl;

@Injectable({ providedIn: 'root' })
export class RecommendationsApi extends BaseApi {
  private http                  = inject(HttpClient);
  private translate             = inject(TranslateService);
  private locationAssembler     = new LocationSnapshotAssembler();
  private weatherAssembler      = new WeatherContextAssembler();
  private travelAssembler       = new TravelContextAssembler();
  private sessionAssembler      = new RecommendationSessionAssembler();

  getAvailableLocations(): Observable<WeatherContext[]> {
    return this.http
      .get<WeatherContextResource[]>(`${BASE}${environment.weatherSnapshotsEndpointPath}`)
      .pipe(
        map(list => list.map(r => this.weatherAssembler.toEntityFromResource(r))),
        retry(2),
        catchError(err => throwError(() => err)),
      );
  }

  getLatestLocationSnapshot(userId: string): Observable<LocationSnapshot | null> {
    const params = new HttpParams()
      .set('userId', userId)
      .set('_sort', 'recorded_at')
      .set('_order', 'desc')
      .set('_limit', '1');
    return this.http
      .get<LocationSnapshotResource[]>(`${BASE}${environment.locationSnapshotsEndpointPath}`, { params })
      .pipe(
        map(list => list.length > 0 ? this.locationAssembler.toEntityFromResource(list[0]) : null),
        retry(2),
        catchError(err => throwError(() => err)),
      );
  }

  getCurrentWeather(city: string): Observable<WeatherContext | null> {
    const params = new HttpParams().set('city', city);
    return this.http
      .get<WeatherContextResource[]>(`${BASE}${environment.weatherSnapshotsEndpointPath}`, { params })
      .pipe(
        map(list => list.length > 0 ? this.weatherAssembler.toEntityFromResource(list[0]) : null),
        retry(2),
        catchError(err => throwError(() => err)),
      );
  }

  getWeatherRecommendations(weatherType: WeatherType): Observable<RecommendationCard[]> {
    const params = new HttpParams()
      .set('weather_type', weatherType)
      .set('card_type', 'weather');
    return forkJoin([
      this.http.get<RecommendationCardResource[]>(`${BASE}${environment.recommendationCardsEndpointPath}`, { params }),
      this.getFoods(),
    ]).pipe(
      map(([cards, foods]) => cards.map(r => this.toCard(r, foods)).filter((c): c is RecommendationCard => c !== null)),
      retry(2),
      catchError(err => throwError(() => err)),
    );
  }

  getTravelRecommendations(cityId: string): Observable<RecommendationCard[]> {
    const params = new HttpParams()
      .set('travel_city', cityId)
      .set('card_type', 'travel');
    return forkJoin([
      this.http.get<RecommendationCardResource[]>(`${BASE}${environment.recommendationCardsEndpointPath}`, { params }),
      this.getFoods(),
    ]).pipe(
      map(([cards, foods]) => cards.map(r => this.toCard(r, foods)).filter((c): c is RecommendationCard => c !== null)),
      retry(2),
      catchError(err => throwError(() => err)),
    );
  }

  getPreventiveRecommendation(): Observable<RecommendationCard> {
    const params = new HttpParams().set('card_type', 'preventive');
    return forkJoin([
      this.http.get<RecommendationCardResource[]>(`${BASE}${environment.recommendationCardsEndpointPath}`, { params }),
      this.getFoods(),
    ]).pipe(
      map(([cards, foods]) => cards.map(r => this.toCard(r, foods)).filter((c): c is RecommendationCard => c !== null)[0]),
      retry(2),
      catchError(err => throwError(() => err)),
    );
  }

  getInterventionRecommendation(): Observable<RecommendationCard> {
    const params = new HttpParams().set('card_type', 'intervention');
    return forkJoin([
      this.http.get<RecommendationCardResource[]>(`${BASE}${environment.recommendationCardsEndpointPath}`, { params }),
      this.getFoods(),
    ]).pipe(
      map(([cards, foods]) => cards.map(r => this.toCard(r, foods)).filter((c): c is RecommendationCard => c !== null)[0]),
      retry(2),
      catchError(err => throwError(() => err)),
    );
  }

  getRecommendationSession(userId: string): Observable<RecommendationSession | null> {
    const params = new HttpParams().set('userId', userId).set('is_active', 'true');
    return this.http
      .get<RecommendationSessionResource[]>(`${BASE}${environment.recommendationSessionsEndpointPath}`, { params })
      .pipe(
        map(list => list.length > 0 ? this.sessionAssembler.toEntityFromResource(list[0]) : null),
        retry(2),
        catchError(err => throwError(() => err)),
      );
  }

  getStrategyAdjustment(status: AdherenceStatus, userId: string): Observable<RecommendationSession> {
    const params = new HttpParams().set('userId', userId).set('is_active', 'true');
    return this.http
      .get<RecommendationSessionResource[]>(`${BASE}${environment.recommendationSessionsEndpointPath}`, { params })
      .pipe(
        map(list => {
          const consecutiveMisses = status === AdherenceStatus.DROPPED ? 5
            : status === AdherenceStatus.AT_RISK ? 2 : 0;
          const resource = list[0];
          if (!resource) {
            return this.sessionAssembler.toEntityFromResource({
              id:                     0,
              userId,
              adherence_status:       status,
              consecutive_misses:     consecutiveMisses,
              simplified_kcal_target: 0,
              created_at:             new Date().toISOString(),
              is_active:              true,
            } as RecommendationSessionResource);
          }
          const patched = { ...resource, adherence_status: status, consecutive_misses: consecutiveMisses };
          this.http
            .patch(
              `${BASE}${environment.recommendationSessionsEndpointPath}/${patched.id}`,
              { adherence_status: patched.adherence_status, consecutive_misses: patched.consecutive_misses },
            )
            .pipe(retry(2), catchError(err => throwError(() => err)))
            .subscribe();
          return this.sessionAssembler.toEntityFromResource(patched);
        }),
        retry(2),
        catchError(err => throwError(() => err)),
      );
  }

  getTravelContext(userId: string): Observable<TravelContext | null> {
    const params = new HttpParams().set('userId', userId);
    return this.http
      .get<TravelContextResource[]>(`${BASE}${environment.travelContextsEndpointPath}`, { params })
      .pipe(
        map(list => list.length > 0 ? this.travelAssembler.toEntityFromResource(list[0]) : null),
        retry(2),
        catchError(err => throwError(() => err)),
      );
  }

  activateTravelMode(city: string, country: string, userId: string): Observable<TravelContext> {
    const params = new HttpParams().set('userId', userId);
    return this.http
      .get<TravelContextResource[]>(`${BASE}${environment.travelContextsEndpointPath}`, { params })
      .pipe(
        switchMap(list => {
          const body = {
            city,
            country,
            is_active:    true,
            is_manual:    false,
            activated_at: new Date().toISOString(),
          };
          if (list[0]) {
            return this.http
              .patch<TravelContextResource>(
                `${BASE}${environment.travelContextsEndpointPath}/${list[0].id}`,
                body,
              )
              .pipe(map(updated => this.travelAssembler.toEntityFromResource(updated)));
          }
          return this.http
            .post<TravelContextResource>(
              `${BASE}${environment.travelContextsEndpointPath}`,
              { userId, ...body },
            )
            .pipe(map(created => this.travelAssembler.toEntityFromResource(created)));
        }),
        retry(2),
        catchError(err => throwError(() => err)),
      );
  }

  deactivateTravelMode(userId: string): Observable<TravelContext> {
    const params = new HttpParams().set('userId', userId);
    return this.http
      .get<TravelContextResource[]>(`${BASE}${environment.travelContextsEndpointPath}`, { params })
      .pipe(
        map(list => {
          const resource = list[0];
          if (!resource) {
            return new TravelContext({ id: 0, city: '', country: '', isActive: false, isManual: false, activatedAt: '' });
          }
          const patched: TravelContextResource = {
            ...resource,
            city: '', country: '', is_active: false, is_manual: false, activated_at: '',
          };
          this.http
            .patch(
              `${BASE}${environment.travelContextsEndpointPath}/${patched.id}`,
              { city: '', country: '', is_active: false, is_manual: false, activated_at: '' },
            )
            .pipe(retry(2), catchError(err => throwError(() => err)))
            .subscribe();
          return this.travelAssembler.toEntityFromResource(patched);
        }),
        retry(2),
        catchError(err => throwError(() => err)),
      );
  }

  private getFoods(): Observable<FoodCardResource[]> {
    return this.http
      .get<FoodCardResource[]>(`${BASE}${environment.foodSearchEndpointPath}`)
      .pipe(retry(2), catchError(err => throwError(() => err)));
  }

  private toCard(r: RecommendationCardResource, foods: FoodCardResource[]): RecommendationCard | null {
    const food = foods.find(f => String(f.id) === String(r.food_id));
    if (!food) return null;
    const es = this.translate.currentLang === 'es';
    return {
      id:          r.id,
      foodId:      food.id,
      name:        es ? (food.name_es ?? food.name) : food.name,
      description: es ? r.description_es : r.description,
      calories:    food.calories_per_100g,
      protein:     `P ${food.protein_per_100g}g`,
      badge:       r.badge,
    };
  }
}
