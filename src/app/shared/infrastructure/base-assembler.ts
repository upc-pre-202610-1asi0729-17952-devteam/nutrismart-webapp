import { BaseResource, BaseResponse } from './base-response';
import { BaseEntity } from './base-entity';

/**
 * Defines the bidirectional mapping between a domain entity and its API
 * representations (resource / response envelope).
 *
 * Each bounded context implements a concrete assembler that knows how to
 * convert between the domain model and the specific shape returned by its
 * REST endpoints.
 *
 * @template TEntity  - The domain entity type (must extend `BaseEntity`).
 * @template TResource - The flat API resource DTO (must extend `BaseResource`).
 * @template TResponse - The response envelope type (must extend `BaseResponse`).
 */
export interface BaseAssembler<
  TEntity extends BaseEntity,
  TResource extends BaseResource,
  TResponse extends BaseResponse
> {
  /**
   * Converts a single API resource object into a domain entity.
   *
   * @param resource - Raw resource object as received from the API.
   * @returns The corresponding domain entity.
   */
  toEntityFromResource(resource: TResource): TEntity;

  /**
   * Converts a domain entity into an API resource object suitable for
   * sending in POST / PUT request bodies.
   *
   * @param entity - The domain entity to serialize.
   * @returns The API resource representation.
   */
  toResourceFromEntity(entity: TEntity): TResource;

  /**
   * Extracts and converts all entities from an API response envelope.
   *
   * Use this when the endpoint returns a wrapper object (e.g. paginated
   * responses) rather than a plain array.
   *
   * @param response - The full response envelope from the API.
   * @returns An array of domain entities.
   */
  toEntitiesFromResponse(response: TResponse): TEntity[];
}
