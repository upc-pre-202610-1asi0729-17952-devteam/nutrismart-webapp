/**
 * Base class for API service facades in a bounded context.
 *
 * Extend this class to create the public API surface that Angular components
 * and application services interact with. Concrete subclasses should inject
 * one or more `BaseApiEndpoint` instances and expose domain-specific methods.
 *
 * @example
 * ```typescript
 * @Injectable({ providedIn: 'root' })
 * export class NutritionApi extends BaseApi {
 *   constructor(private logEndpoint: NutritionLogEndpoint) { super(); }
 *   getLogs(date: string) { return this.logEndpoint.getAll(); }
 * }
 * ```
 */
export abstract class BaseApi {}
