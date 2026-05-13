import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { BaseEntity } from './base-entity';
import { BaseResource, BaseResponse } from './base-response';
import { BaseAssembler } from './base-assembler';

/**
 * Abstract base class that provides generic CRUD operations for a single
 * REST endpoint.
 *
 * Concrete endpoint classes extend this class, pass the endpoint URL and an
 * assembler to the `super()` call, and inherit all HTTP methods without
 * duplicating boilerplate.
 *
 * @template TEntity    - Domain entity type managed by this endpoint.
 * @template TResource  - API resource DTO shape (flat JSON object).
 * @template TResponse  - API response envelope (may wrap an array or add metadata).
 * @template TAssembler - Assembler that converts between entity and resource/response.
 *
 * @example
 * ```typescript
 * @Injectable({ providedIn: 'root' })
 * export class NutritionLogEndpoint extends BaseApiEndpoint<
 *   NutritionLog, NutritionLogResource, NutritionLogResponse, NutritionLogAssembler
 * > {
 *   constructor(http: HttpClient, assembler: NutritionLogAssembler) {
 *     super(http, `${environment.apiBaseUrl}${environment.nutritionLogEndpointPath}`, assembler);
 *   }
 * }
 * ```
 */
export abstract class BaseApiEndpoint<
  TEntity extends BaseEntity,
  TResource extends BaseResource,
  TResponse extends BaseResponse,
  TAssembler extends BaseAssembler<TEntity, TResource, TResponse>
> {
  /**
   * @param http        - Angular's `HttpClient` for making HTTP requests.
   * @param endpointUrl - Full URL of the REST endpoint (base URL + path).
   * @param assembler   - Assembler instance used to map between entity and resource.
   */
  protected constructor(
    protected http: HttpClient,
    protected endpointUrl: string,
    protected assembler: TAssembler
  ) {}

  /**
   * Fetches all resources from the endpoint.
   *
   * Handles both plain-array responses and envelope responses transparently:
   * if the API returns an array it maps each item individually; otherwise it
   * delegates to `assembler.toEntitiesFromResponse`.
   *
   * @returns Observable emitting an array of domain entities.
   */
  getAll(): Observable<TEntity[]> {
    return this.http.get<TResponse | TResource[]>(this.endpointUrl).pipe(
      map(response => {
        if (Array.isArray(response)) {
          return response.map(resource =>
            this.assembler.toEntityFromResource(resource)
          );
        }
        return this.assembler.toEntitiesFromResponse(response as TResponse);
      }),
      catchError(this.handleError('Failed to fetch entities'))
    );
  }

  /**
   * Fetches a single resource by its numeric ID.
   *
   * @param id - The numeric identifier of the resource.
   * @returns Observable emitting the matching domain entity.
   */
  getById(id: number): Observable<TEntity> {
    return this.http
      .get<TResource>(`${this.endpointUrl}/${id}`)
      .pipe(
        map(resource => this.assembler.toEntityFromResource(resource)),
        catchError(this.handleError('Failed to fetch entity'))
      );
  }

  /**
   * Creates a new resource on the server.
   *
   * The entity is converted to a resource DTO before being sent, and the
   * server's response (the created resource) is converted back to an entity.
   *
   * @param entity - The domain entity to persist.
   * @returns Observable emitting the created entity as returned by the server.
   */
  create(entity: TEntity): Observable<TEntity> {
    const resource = this.assembler.toResourceFromEntity(entity);
    // Omit `id` from POST body — the server assigns the canonical ID.
    // Sending a client-generated id causes json-server v1 to return 404.
    const { id, ...body } = resource as Record<string, unknown>;
    return this.http.post<TResource>(this.endpointUrl, body).pipe(
      map(created => this.assembler.toEntityFromResource(created)),
      catchError(this.handleError('Failed to create entity'))
    );
  }

  /**
   * Replaces an existing resource identified by `id` with the given entity.
   *
   * @param entity - Updated domain entity data.
   * @param id     - Numeric ID of the resource to replace.
   * @returns Observable emitting the updated entity as returned by the server.
   */
  update(entity: TEntity, id: number): Observable<TEntity> {
    const resource = this.assembler.toResourceFromEntity(entity);
    return this.http
      .put<TResource>(`${this.endpointUrl}/${id}`, resource)
      .pipe(
        map(updated => this.assembler.toEntityFromResource(updated)),
        catchError(this.handleError('Failed to update entity'))
      );
  }

  /**
   * Deletes the resource with the given ID.
   *
   * @param id - Numeric ID of the resource to delete.
   * @returns Observable that completes when the deletion succeeds.
   */
  delete(id: number): Observable<void> {
    return this.http
      .delete<void>(`${this.endpointUrl}/${id}`)
      .pipe(catchError(this.handleError('Failed to delete entity')));
  }

  /**
   * Returns an RxJS error-handler function that maps `HttpErrorResponse`
   * into a descriptive `Error` and re-throws it as an observable error.
   *
   * @param operation - Human-readable label for the operation that failed.
   *                    Prepended to the error message for easier debugging.
   * @returns A function compatible with `catchError`.
   */
  protected handleError(operation: string) {
    return (error: HttpErrorResponse): Observable<never> => {
      let errorMessage = operation;
      if (error.status === 404) {
        errorMessage = `${operation}: Resource not found`;
      } else if (error.error instanceof ErrorEvent) {
        errorMessage = `${operation}: ${error.error.message}`;
      } else {
        errorMessage = `${operation}: ${error.statusText || 'Unexpected error'}`;
      }
      return throwError(() => new Error(errorMessage));
    };
  }
}
