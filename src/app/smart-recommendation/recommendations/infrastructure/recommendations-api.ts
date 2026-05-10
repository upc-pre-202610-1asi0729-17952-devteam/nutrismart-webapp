import { inject, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { BaseApi } from '../../../shared/infrastructure/base-api';
import { WeatherContext } from '../domain/model/weather-context.entity';
import { TravelContext } from '../domain/model/travel-context.entity';
import { RecommendationSession } from '../domain/model/recommendation-session.entity';
import { WeatherType } from '../domain/model/weather-type.enum';
import { AdherenceStatus } from '../domain/model/adherence-status.enum';

/**
 * DTO returned by weather recommendation endpoints.
 *
 * @author Espinoza Cruz, Angela Milagros
 */
export interface RecommendationCard {
  /** Unique identifier. */
  id: number;
  /** Food or dish name. */
  name: string;
  /** Comma-separated descriptor tags (e.g. "Refreshing · High in protein"). */
  description: string;
  /** Kilocalories. */
  kcal: number;
  /** Protein grams label (e.g. "P 32g"). */
  protein: string;
  /** Weather or cuisine badge label (e.g. "Light", "Local"). */
  badge: string;
}

/**
 * Application-facing API façade for the Smart Recommendation bounded context.
 *
 * All methods return mock data — a real implementation would replace the
 * `of(...)` calls with HTTP endpoint calls. Provided in root so a single
 * instance is shared across the application.
 *
 * @author Espinoza Cruz, Angela Milagros
 */
@Injectable({ providedIn: 'root' })
export class RecommendationsApi extends BaseApi {

  /**
   * Returns weather-based meal recommendations for the current context.
   *
   * @param weatherType - Current classified weather type.
   * @returns Observable emitting a list of recommendation cards.
   */
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

  /**
   * Activates travel mode for the specified city.
   *
   * @param city    - The city to activate travel mode for.
   * @param country - The country of the city.
   * @returns Observable emitting the updated {@link TravelContext}.
   */
  activateTravelMode(city: string, country: string): Observable<TravelContext> {
    const ctx = new TravelContext({
      id: 1, city, country,
      isActive: true, isManual: true,
      activatedAt: new Date().toISOString(),
    });
    return of(ctx);
  }

  /**
   * Deactivates travel mode, returning the user to their home location context.
   *
   * @returns Observable emitting the deactivated {@link TravelContext}.
   */
  deactivateTravelMode(): Observable<TravelContext> {
    const ctx = new TravelContext({
      id: 1, city: '', country: '',
      isActive: false, isManual: false,
      activatedAt: '',
    });
    return of(ctx);
  }

  /**
   * Returns local dish recommendations for the travel city.
   *
   * @param city - The travel city to fetch local dishes for.
   * @returns Observable emitting local dish recommendation cards.
   */
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
    // Unrecognized city — return empty to trigger fallback in the store
    return of([]);
  }

  /**
   * Returns a preventive recommendation for an AT_RISK user.
   *
   * @returns Observable emitting a single preventive recommendation card.
   */
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

  /**
   * Returns an intervention plan recommendation for a DROPPED user.
   *
   * @returns Observable emitting a single intervention recommendation card.
   */
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

  /**
   * Returns an adjusted recommendation strategy for a changed adherence state.
   *
   * @param status - The new adherence status to adjust for.
   * @returns Observable emitting the updated {@link RecommendationSession}.
   */
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

  /**
   * Returns the current weather context for the user's location.
   *
   * @returns Observable emitting the current {@link WeatherContext}.
   */
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
