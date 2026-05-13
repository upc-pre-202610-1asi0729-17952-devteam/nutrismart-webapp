import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { MetabolicAdaptationLog } from '../domain/model/metabolic-adaptation-log.entity';
import { MetabolicChangeTrigger } from '../domain/model/metabolic-change-trigger.enum';
import {
  MetabolicAdaptationLogResource,
  MetabolicAdaptationLogResponse,
} from './metabolic-adaptation-log-resource';

/**
 * Converts between {@link MetabolicAdaptationLog} domain entities and the API wire format.
 */
export class MetabolicAdaptationLogAssembler implements BaseAssembler<
  MetabolicAdaptationLog,
  MetabolicAdaptationLogResource,
  MetabolicAdaptationLogResponse
> {
  /**
   * Maps a raw API resource to a {@link MetabolicAdaptationLog} entity.
   *
   * @param resource - Raw API resource object.
   * @returns The constructed domain entity.
   */
  toEntityFromResource(resource: MetabolicAdaptationLogResource): MetabolicAdaptationLog {
    return new MetabolicAdaptationLog({
      id:               resource.id ?? undefined,
      userId:           Number(resource.userId),
      triggeredBy:      resource.triggeredBy as MetabolicChangeTrigger,
      previousCalories: resource.previousCalories,
      newCalories:      resource.newCalories,
      previousProtein:  resource.previousProtein,
      newProtein:       resource.newProtein,
      previousCarbs:    resource.previousCarbs,
      newCarbs:         resource.newCarbs,
      previousFat:      resource.previousFat,
      newFat:           resource.newFat,
      changedAt:        resource.changedAt,
    });
  }

  /**
   * Serialises a {@link MetabolicAdaptationLog} entity to an API resource DTO.
   *
   * @param entity - The domain entity to serialise.
   * @returns The API resource representation.
   */
  toResourceFromEntity(entity: MetabolicAdaptationLog): MetabolicAdaptationLogResource {
    return {
      id:               entity.id,
      userId:           entity.userId,
      triggeredBy:      entity.triggeredBy,
      previousCalories: entity.previousCalories,
      newCalories:      entity.newCalories,
      previousProtein:  entity.previousProtein,
      newProtein:       entity.newProtein,
      previousCarbs:    entity.previousCarbs,
      newCarbs:         entity.newCarbs,
      previousFat:      entity.previousFat,
      newFat:           entity.newFat,
      changedAt:        entity.changedAt,
    };
  }

  /**
   * Extracts all entities from the API response envelope.
   *
   * @param response - The full API response envelope.
   * @returns Array of {@link MetabolicAdaptationLog} entities.
   */
  toEntitiesFromResponse(response: MetabolicAdaptationLogResponse): MetabolicAdaptationLog[] {
    return response.metabolicAdaptationLogs.map(r => this.toEntityFromResource(r));
  }
}
