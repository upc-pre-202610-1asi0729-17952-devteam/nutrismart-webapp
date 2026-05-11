import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { FoodItem } from '../domain/model/food-item.entity';
import { MealRecord } from '../domain/model/meal-record.entity';
import { DailyIntake } from '../domain/model/daily-intake.entity';
import { FoodItemAssembler, MealRecordAssembler, DailyIntakeAssembler } from './nutrition-assembler';
import {
  FoodItemResource, FoodItemsResponse,
  MealRecordResource, MealRecordsResponse,
  DailyIntakeResource, DailyIntakeResponse,
} from './nutrition-resource';
import { map } from 'rxjs/operators';

/**
 * HTTP endpoint for the `/foods` food search REST resource.
 *
 * @author Mora Rivera, Joel Fernando
 */
export class FoodSearchEndpoint extends BaseApiEndpoint<
  FoodItem, FoodItemResource, FoodItemsResponse, FoodItemAssembler
> {
  constructor(http: HttpClient) {
    super(
      http,
      environment.apiBaseUrl + environment.foodSearchEndpointPath,
      new FoodItemAssembler()
    );
  }

  /**
   * Searches food items by name using a partial match query.
   *
   * @param query - Partial food name to search for.
   * @returns Observable emitting matching {@link FoodItem} entities.
   */
  searchByName(query: string): Observable<FoodItem[]> {
    const q = query.toLowerCase();
    return this.http
      .get<FoodItemResource[]>(this.endpointUrl)
      .pipe(
        map((resources) =>
          resources
            .filter((r) =>
              r.name.toLowerCase().includes(q) ||
              (r.name_es?.toLowerCase().includes(q) ?? false),
            )
            .map((r) => this.assembler.toEntityFromResource(r)),
        ),
      );
  }
}

/**
 * HTTP endpoint for the `/nutrition-log` meal records REST resource.
 *
 * @author Mora Rivera, Joel Fernando
 */
export class NutritionLogEndpoint extends BaseApiEndpoint<
  MealRecord, MealRecordResource, MealRecordsResponse, MealRecordAssembler
> {
  constructor(http: HttpClient) {
    super(
      http,
      environment.apiBaseUrl + environment.nutritionLogEndpointPath,
      new MealRecordAssembler()
    );
  }

  /**
   * Fetches all meal records for a specific user.
   *
   * @param userId - The user whose records should be fetched.
   * @returns Observable emitting an array of {@link MealRecord} entities.
   */
  getByUserId(userId: any): Observable<MealRecord[]> {
    return this.http
      .get<MealRecordResource[]>(this.endpointUrl)
      .pipe(map((resources) => resources.map((r) => this.assembler.toEntityFromResource(r))));
  }
}

/**
 * HTTP endpoint for the `/daily-balance` REST resource.
 *
 * @author Mora Rivera, Joel Fernando
 */
export class DailyBalanceEndpoint extends BaseApiEndpoint<
  DailyIntake, DailyIntakeResource, DailyIntakeResponse, DailyIntakeAssembler
> {
  constructor(http: HttpClient) {
    super(
      http,
      environment.apiBaseUrl + environment.dailyBalanceEndpointPath,
      new DailyIntakeAssembler()
    );
  }
}
