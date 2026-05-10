import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, retry } from 'rxjs/operators';
import { environment } from '../../../environments/environment.development';
import { BaseApi } from '../../shared/infrastructure/base-api';
import { UserGoal } from '../../iam/domain/model/user-goal.enum';
import { PantryItem } from '../domain/model/pantry-item.entity';
import { RecipeSuggestion } from '../domain/model/recipe-suggestion.entity';
import { PantryItemAssembler, RecipeSuggestionAssembler } from './pantry-assembler';
import { PantryItemResource, RecipeSuggestionResource } from './pantry-resource';

@Injectable({ providedIn: 'root' })
export class PantryApi extends BaseApi {
  private readonly _http              = inject(HttpClient);
  private readonly _pantryAssembler   = new PantryItemAssembler();
  private readonly _recipeAssembler   = new RecipeSuggestionAssembler();
  private readonly _pantryUrl         = `${environment.apiBaseUrl}${environment.pantryEndpointPath}`;
  private readonly _recipesUrl        = `${environment.apiBaseUrl}${environment.recipesEndpointPath}`;

  getPantryItems(userId: number): Observable<PantryItem[]> {
    return this._http.get<PantryItemResource[]>(`${this._pantryUrl}?user_id=${userId}`).pipe(
      map(rs => rs.map(r => this._pantryAssembler.toEntityFromResource(r))),
      catchError(this._handleError('getPantryItems')),
    );
  }

  addPantryItem(item: PantryItem): Observable<PantryItem> {
    const resource = this._pantryAssembler.toResourceFromEntity(item);
    return this._http.post<PantryItemResource>(this._pantryUrl, resource).pipe(
      map(r => this._pantryAssembler.toEntityFromResource(r)),
      retry(2),
      catchError(this._handleError('addPantryItem')),
    );
  }

  deletePantryItem(itemId: number): Observable<void> {
    return this._http.delete<void>(`${this._pantryUrl}/${itemId}`).pipe(
      retry(2),
      catchError(this._handleError('deletePantryItem')),
    );
  }

  getRecipeSuggestions(goalType: UserGoal): Observable<RecipeSuggestion[]> {
    return this._http.get<RecipeSuggestionResource[]>(`${this._recipesUrl}?goal_type=${goalType}`).pipe(
      map(rs => rs.map(r => this._recipeAssembler.toEntityFromResource(r))),
      catchError(this._handleError('getRecipeSuggestions')),
    );
  }

  private _handleError(operation: string) {
    return (error: HttpErrorResponse): Observable<never> =>
      throwError(() => new Error(`${operation} failed: ${error.statusText ?? error.message}`));
  }
}
