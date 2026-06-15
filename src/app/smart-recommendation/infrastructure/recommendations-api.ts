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
  /** English canonical name — used as foodItemName when logging to the meal diary. */
  name: string;
  /** Spanish name — used as foodItemNameEs when logging to the meal diary. */
  nameEs: string;
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
      .set('_sort', 'recordedAt')
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

  saveLocationSnapshot(userId: string, city: string, country: string): Observable<LocationSnapshot> {
    const body = { userId, city, country, recordedAt: new Date().toISOString() };
    return this.http
      .post<LocationSnapshotResource>(`${BASE}${environment.locationSnapshotsEndpointPath}`, body)
      .pipe(
        map(r => this.locationAssembler.toEntityFromResource(r)),
        retry(2),
        catchError(err => throwError(() => err)),
      );
  }

  syncWeatherSnapshot(city: string, country: string): Observable<void> {
    return this.http
      .post<void>(`${BASE}${environment.weatherSnapshotsEndpointPath}/sync`, { city, country })
      .pipe(
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
      .set('weatherType', weatherType)
      .set('cardType', 'weather');
    return forkJoin([
      this.http.get<RecommendationCardResource[]>(`${BASE}${environment.recommendationCardsEndpointPath}`, { params }),
      this.getFoods(),
    ]).pipe(
      map(([cards, foods]) => cards.map(r => this.toCard(r, foods)).filter((c): c is RecommendationCard => c !== null)),
      retry(2),
      catchError(err => throwError(() => err)),
    );
  }

  getTravelRecommendations(cityId: string, country: string): Observable<RecommendationCard[]> {
    let params = new HttpParams()
      .set('travelCity', cityId)
      .set('cardType', 'travel');
    if (country) params = params.set('travelCountry', country);
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
    const params = new HttpParams().set('cardType', 'preventive');
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
    const params = new HttpParams().set('cardType', 'intervention');
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
    const params = new HttpParams().set('userId', userId).set('isActive', 'true');
    return this.http
      .get<RecommendationSessionResource[]>(`${BASE}${environment.recommendationSessionsEndpointPath}`, { params })
      .pipe(
        map(list => list.length > 0 ? this.sessionAssembler.toEntityFromResource(list[0]) : null),
        retry(2),
        catchError(err => throwError(() => err)),
      );
  }

  getStrategyAdjustment(status: AdherenceStatus, userId: string): Observable<RecommendationSession> {
    const params = new HttpParams().set('userId', userId).set('isActive', 'true');
    return this.http
      .get<RecommendationSessionResource[]>(`${BASE}${environment.recommendationSessionsEndpointPath}`, { params })
      .pipe(
        map(list => {
          const consecutiveMisses = status === AdherenceStatus.DROPPED ? 5
            : status === AdherenceStatus.AT_RISK ? 2 : 0;
          const resource = list[0];
          if (!resource) {
            return this.sessionAssembler.toEntityFromResource({
              id:                   0,
              userId,
              adherenceStatus:      status,
              consecutiveMisses,
              simplifiedKcalTarget: 0,
              createdAt:            new Date().toISOString(),
              isActive:             true,
            } as RecommendationSessionResource);
          }
          const updated = { ...resource, adherenceStatus: status, consecutiveMisses };
          this.http
            .put(
              `${BASE}${environment.recommendationSessionsEndpointPath}/${updated.id}`,
              { adherenceStatus: updated.adherenceStatus, consecutiveMisses: updated.consecutiveMisses },
            )
            .pipe(retry(2), catchError(err => throwError(() => err)))
            .subscribe();
          return this.sessionAssembler.toEntityFromResource(updated);
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
          const activatedAt = new Date().toISOString();
          if (list[0]) {
            const body = { city, country, isActive: true, isManual: false, activatedAt };
            return this.http
              .put<TravelContextResource>(
                `${BASE}${environment.travelContextsEndpointPath}/${list[0].id}`,
                body,
              )
              .pipe(map(updated => this.travelAssembler.toEntityFromResource(updated)));
          }
          const body = { userId, city, country, isActive: true, isManual: false, activatedAt };
          return this.http
            .post<TravelContextResource>(
              `${BASE}${environment.travelContextsEndpointPath}`,
              body,
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
          const deactivated: TravelContextResource = {
            ...resource,
            city: '', country: '', isActive: false, isManual: false, activatedAt: '',
          };
          this.http
            .put(
              `${BASE}${environment.travelContextsEndpointPath}/${deactivated.id}`,
              { city: '', country: '', isActive: false, isManual: false, activatedAt: '' },
            )
            .pipe(retry(2), catchError(err => throwError(() => err)))
            .subscribe();
          return this.travelAssembler.toEntityFromResource(deactivated);
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
    const food = foods.find(f => String(f.id) === String(r.foodId));
    if (!food) return null;
    const es = this.translate.currentLang === 'es';
    return {
      id:          r.id,
      foodId:      food.id,
      name:        food.name,
      nameEs:      food.nameEs ?? food.name,
      description: es ? r.descriptionEs : r.description,
      calories:    food.caloriesPer100g,
      protein:     `P ${food.proteinPer100g}g`,
      badge:       r.badge,
    };
  }
}
