import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { TranslateService } from '@ngx-translate/core';
import { forkJoin, Observable, throwError } from 'rxjs';
import { catchError, map, retry } from 'rxjs/operators';
import { environment } from '../../../environments/environment.development';
import { BaseApi } from '../../shared/infrastructure/base-api';
import { UserGoal } from '../../iam/domain/model/user-goal.enum';
import { FoodItem } from '../../nutrition-tracking/domain/model/food-item.entity';
import { FoodItemAssembler } from '../../nutrition-tracking/infrastructure/nutrition-assembler';
import { FoodItemResource } from '../../nutrition-tracking/infrastructure/nutrition-resource';
import { PantryItem } from '../domain/model/pantry-item.entity';
import { RecipeSuggestion } from '../domain/model/recipe-suggestion.entity';
import { PantryItemAssembler, RecipeSuggestionAssembler } from './pantry-assembler';
import { PantryItemResource, RecipeSuggestionResource } from './pantry-resource';


@Injectable({ providedIn: 'root' })
export class PantryApi extends BaseApi {
  private readonly _http              = inject(HttpClient);
  private readonly _translate         = inject(TranslateService);
  private readonly _pantryAssembler   = new PantryItemAssembler();
  private readonly _recipeAssembler   = new RecipeSuggestionAssembler(this._translate);
  private readonly _foodAssembler     = new FoodItemAssembler();
  private readonly _pantryUrl         = `${environment.apiBaseUrl}${environment.pantryEndpointPath}`;
  private readonly _recipesUrl        = `${environment.apiBaseUrl}${environment.recipesEndpointPath}`;
  private readonly _foodsUrl          = `${environment.apiBaseUrl}${environment.foodSearchEndpointPath}`;

  getPantryItems(userId: number): Observable<PantryItem[]> {
    return forkJoin({
      items:   this._http.get<PantryItemResource[]>(`${this._pantryUrl}?userId=${userId}`),
      foodMap: this._foodsMap(),
    }).pipe(
      map(({ items, foodMap }) =>
        items.map(r => this._pantryAssembler.toEntityFromResource(r, foodMap.get(String(r.foodId)))),
      ),
      catchError(this._handleError('getPantryItems')),
    );
  }

  addPantryItem(item: PantryItem): Observable<PantryItem> {
    const resource = this._pantryAssembler.toResourceFromEntity(item);
    return forkJoin({
      created: this._http.post<PantryItemResource>(this._pantryUrl, resource).pipe(retry(2)),
      foodMap: this._foodsMap(),
    }).pipe(
      map(({ created, foodMap }) =>
        this._pantryAssembler.toEntityFromResource(created, foodMap.get(String(created.foodId))),
      ),
      catchError(this._handleError('addPantryItem')),
    );
  }

  private _foodsMap(): Observable<Map<string, FoodItem>> {
    return this._http.get<FoodItemResource[]>(this._foodsUrl).pipe(
      map(rs => new Map(rs.map(r => [String(r.id), this._foodAssembler.toEntityFromResource(r)]))),
    );
  }

  deletePantryItem(itemId: number): Observable<void> {
    return this._http.delete<void>(`${this._pantryUrl}/${itemId}`).pipe(
      retry(2),
      catchError(this._handleError('deletePantryItem')),
    );
  }

  getRecipeSuggestions(goalType: UserGoal): Observable<RecipeSuggestion[]> {
    return this._http.get<RecipeSuggestionResource[]>(`${this._recipesUrl}?goalType=${goalType}`).pipe(
      map(rs => rs.map(r => this._recipeAssembler.toEntityFromResource(r))),
      catchError(this._handleError('getRecipeSuggestions')),
    );
  }

  getFoodCatalog(): Observable<FoodItem[]> {
    return this._http.get<FoodItemResource[]>(`${this._foodsUrl}?itemType=INGREDIENT`).pipe(
      map(rs => rs.map(r => this._foodAssembler.toEntityFromResource(r))),
      catchError(this._handleError('getFoodCatalog')),
    );
  }

  private _handleError(operation: string) {
    return (error: HttpErrorResponse): Observable<never> =>
      throwError(() => new Error(`${operation} failed: ${error.statusText ?? error.message}`));
  }
}
