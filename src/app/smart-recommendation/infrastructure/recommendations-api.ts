import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map, retry } from 'rxjs/operators';
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
} from './recommendations-resource';
import {
  LocationSnapshotAssembler,
  WeatherContextAssembler,
  TravelContextAssembler,
  RecommendationSessionAssembler,
} from './recommendations-assembler';

export interface RecommendationCard {
  id: number | string;
  name: string;
  description: string;
  kcal: number;
  protein: string;
  badge: string;
}

const BASE = environment.apiBaseUrl;

@Injectable({ providedIn: 'root' })
export class RecommendationsApi extends BaseApi {
  private http                  = inject(HttpClient);
  private locationAssembler     = new LocationSnapshotAssembler();
  private weatherAssembler      = new WeatherContextAssembler();
  private travelAssembler       = new TravelContextAssembler();
  private sessionAssembler      = new RecommendationSessionAssembler();

  getLatestLocationSnapshot(userId: string): Observable<LocationSnapshot | null> {
    const params = new HttpParams()
      .set('user_id', userId)
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
    return this.http
      .get<RecommendationCardResource[]>(`${BASE}${environment.recommendationCardsEndpointPath}`, { params })
      .pipe(
        map(list => list.map(r => this.toCard(r))),
        retry(2),
        catchError(err => throwError(() => err)),
      );
  }

  getTravelRecommendations(city: string): Observable<RecommendationCard[]> {
    const params = new HttpParams()
      .set('travel_city', city)
      .set('card_type', 'travel');
    return this.http
      .get<RecommendationCardResource[]>(`${BASE}${environment.recommendationCardsEndpointPath}`, { params })
      .pipe(
        map(list => list.map(r => this.toCard(r))),
        retry(2),
        catchError(err => throwError(() => err)),
      );
  }

  getPreventiveRecommendation(): Observable<RecommendationCard> {
    const params = new HttpParams().set('card_type', 'preventive');
    return this.http
      .get<RecommendationCardResource[]>(`${BASE}${environment.recommendationCardsEndpointPath}`, { params })
      .pipe(
        map(list => this.toCard(list[0])),
        retry(2),
        catchError(err => throwError(() => err)),
      );
  }

  getInterventionRecommendation(): Observable<RecommendationCard> {
    const params = new HttpParams().set('card_type', 'intervention');
    return this.http
      .get<RecommendationCardResource[]>(`${BASE}${environment.recommendationCardsEndpointPath}`, { params })
      .pipe(
        map(list => this.toCard(list[0])),
        retry(2),
        catchError(err => throwError(() => err)),
      );
  }

  getRecommendationSession(userId: string): Observable<RecommendationSession | null> {
    const params = new HttpParams().set('user_id', userId).set('is_active', 'true');
    return this.http
      .get<RecommendationSessionResource[]>(`${BASE}${environment.recommendationSessionsEndpointPath}`, { params })
      .pipe(
        map(list => list.length > 0 ? this.sessionAssembler.toEntityFromResource(list[0]) : null),
        retry(2),
        catchError(err => throwError(() => err)),
      );
  }

  getStrategyAdjustment(status: AdherenceStatus): Observable<RecommendationSession> {
    const params = new HttpParams().set('user_id', '1').set('is_active', 'true');
    return this.http
      .get<RecommendationSessionResource[]>(`${BASE}${environment.recommendationSessionsEndpointPath}`, { params })
      .pipe(
        map(list => {
          const resource = list[0];
          const consecutiveMisses = status === AdherenceStatus.DROPPED ? 5
            : status === AdherenceStatus.AT_RISK ? 2 : 0;
          return this.sessionAssembler.toEntityFromResource({
            ...resource,
            adherence_status:   status,
            consecutive_misses: consecutiveMisses,
          });
        }),
        retry(2),
        catchError(err => throwError(() => err)),
      );
  }

  getTravelContext(userId: string): Observable<TravelContext | null> {
    const params = new HttpParams().set('user_id', userId);
    return this.http
      .get<TravelContextResource[]>(`${BASE}${environment.travelContextsEndpointPath}`, { params })
      .pipe(
        map(list => list.length > 0 ? this.travelAssembler.toEntityFromResource(list[0]) : null),
        retry(2),
        catchError(err => throwError(() => err)),
      );
  }

  activateTravelMode(city: string, country: string): Observable<TravelContext> {
    const params = new HttpParams().set('user_id', '1');
    return this.http
      .get<TravelContextResource[]>(`${BASE}${environment.travelContextsEndpointPath}`, { params })
      .pipe(
        map(list => list[0]),
        map(resource => {
          const patch: Partial<TravelContextResource> = {
            city,
            country,
            is_active:    true,
            is_manual:    false,
            activated_at: new Date().toISOString(),
          };
          return { ...resource, ...patch } as TravelContextResource;
        }),
        catchError(err => throwError(() => err)),
        map(updated => this.travelAssembler.toEntityFromResource(updated)),
      );
  }

  deactivateTravelMode(): Observable<TravelContext> {
    const params = new HttpParams().set('user_id', '1');
    return this.http
      .get<TravelContextResource[]>(`${BASE}${environment.travelContextsEndpointPath}`, { params })
      .pipe(
        map(list => {
          const resource = list[0];
          const patch: Partial<TravelContextResource> = {
            city: '', country: '', is_active: false, is_manual: false, activated_at: '',
          };
          return this.travelAssembler.toEntityFromResource({ ...resource, ...patch });
        }),
        retry(2),
        catchError(err => throwError(() => err)),
      );
  }

  private toCard(r: RecommendationCardResource): RecommendationCard {
    return { id: r.id, name: r.name, description: r.description, kcal: r.kcal, protein: r.protein, badge: r.badge };
  }
}
