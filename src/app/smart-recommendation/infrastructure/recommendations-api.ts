import { inject, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { BaseApi } from '../../shared/infrastructure/base-api';
import { WeatherContext } from '../domain/model/weather-context.entity';
import { TravelContext } from '../domain/model/travel-context.entity';
import { RecommendationSession } from '../domain/model/recommendation-session.entity';
import { WeatherType } from '../domain/model/weather-type.enum';
import { AdherenceStatus } from '../domain/model/adherence-status.enum';

export interface RecommendationCard {
  id: number;
  name: string;
  description: string;
  kcal: number;
  protein: string;
  badge: string;
}

@Injectable({ providedIn: 'root' })
export class RecommendationsApi extends BaseApi {

  getWeatherRecommendations(weatherType: WeatherType): Observable<RecommendationCard[]> {
    if (weatherType === WeatherType.HOT) {
      return of([
        { id: 1, name: 'Chicken and Cucumber Salad', description: 'Refreshing · High in protein · Hydrating', kcal: 320, protein: 'P 32g', badge: 'Light' },
        { id: 2, name: 'Hake ceviche', description: 'Peruvian dish · Fresh and high in protein', kcal: 280, protein: 'P 38g', badge: 'Light' },
        { id: 3, name: 'Gazpacho with wholemeal toast', description: 'Cold soup · Filling without making you feel hot', kcal: 210, protein: 'P 6g', badge: 'Light' },
      ]);
    }
    return of([
      { id: 4, name: 'Lentil soup with bread', description: 'High in iron and plant-based protein', kcal: 420, protein: 'P 22g', badge: 'H. Calories' },
      { id: 5, name: 'Beef stew with sweet potato', description: 'Comfort food · High in protein', kcal: 280, protein: 'P 38g', badge: 'Light' },
      { id: 6, name: 'Tacu tacu with beans', description: 'Peruvian dish · Comfort food', kcal: 210, protein: 'P 18g', badge: 'Light' },
    ]);
  }

  activateTravelMode(city: string, country: string): Observable<TravelContext> {
    const ctx = new TravelContext({
      id: 1, city, country,
      isActive: true, isManual: true,
      activatedAt: new Date().toISOString(),
    });
    return of(ctx);
  }

  deactivateTravelMode(): Observable<TravelContext> {
    const ctx = new TravelContext({
      id: 1, city: '', country: '',
      isActive: false, isManual: false,
      activatedAt: '',
    });
    return of(ctx);
  }

  getTravelRecommendations(city: string): Observable<RecommendationCard[]> {
    const lower = city.toLowerCase();
    if (lower.includes('cusco')) {
      return of([
        { id: 10, name: 'Quinoa soup', description: 'Andean soup · High in plant protein', kcal: 380, protein: 'P 22g', badge: 'Local' },
        { id: 11, name: 'Cusco-style chicken broth', description: 'Restorative · Low in fat', kcal: 190, protein: 'P 28g', badge: 'Local' },
        { id: 12, name: 'Chicken-stuffed causa', description: 'Cold dish · Lactose-free', kcal: 420, protein: 'P 18g', badge: 'Local' },
      ]);
    }
    if (lower.includes('arequipa')) {
      return of([
        { id: 16, name: 'Rocoto relleno', description: 'Stuffed pepper · Traditional Arequipa dish', kcal: 340, protein: 'P 18g', badge: 'Local' },
        { id: 17, name: 'Chupe de camarones', description: 'Shrimp soup · Andean comfort food', kcal: 280, protein: 'P 22g', badge: 'Local' },
        { id: 18, name: 'Adobo arequipeño', description: 'Marinated pork · Local specialty', kcal: 420, protein: 'P 32g', badge: 'Local' },
      ]);
    }
    return of([]);
  }

  getPreventiveRecommendation(): Observable<RecommendationCard> {
    return of({
      id: 20,
      name: 'Grilled chicken with steamed vegetables',
      description: 'Simple · High protein · Compatible with your deficit',
      kcal: 380,
      protein: 'P 42g',
      badge: 'Easy start',
    });
  }

  getInterventionRecommendation(): Observable<RecommendationCard> {
    return of({
      id: 21,
      name: 'Simple egg bowl with toast',
      description: 'Low effort · Nutritionally complete · Quick to prepare',
      kcal: 280,
      protein: 'P 24g',
      badge: 'Day 1',
    });
  }

  getStrategyAdjustment(status: AdherenceStatus): Observable<RecommendationSession> {
    return of(new RecommendationSession({
      id: 1,
      userId: 0,
      adherenceStatus: status,
      consecutiveMisses: status === AdherenceStatus.DROPPED ? 5 : 2,
      simplifiedKcalTarget: 1400,
      createdAt: new Date().toISOString(),
      isActive: true,
    }));
  }

  getCurrentWeather(): Observable<WeatherContext> {
    return of(new WeatherContext({
      id: 1,
      city: 'Lima',
      country: 'Peru',
      temperatureCelsius: 31,
      condition: 'Sunny',
      weatherType: WeatherType.HOT,
      updatedAt: new Date(Date.now() - 5 * 60000).toISOString(),
    }));
  }
}
