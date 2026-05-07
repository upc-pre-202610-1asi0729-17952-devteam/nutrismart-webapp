import { BaseResource, BaseResponse } from './base-response';
import { BaseEntity } from './base-entity';

/**
 * Defines conversions between domain entities and API representations.
 */
export interface BaseAssembler<
  TEntity extends BaseEntity,
  TResource extends BaseResource,
  TResponse extends BaseResponse
> {
  toEntityFromResource(resource: TResource): TEntity;
  toResourceFromEntity(entity: TEntity): TResource;
  toEntitiesFromResponse(response: TResponse): TEntity[];
}
