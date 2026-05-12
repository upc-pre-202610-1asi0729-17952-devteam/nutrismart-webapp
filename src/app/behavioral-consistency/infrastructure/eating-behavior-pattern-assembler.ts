import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { BehaviorPatternType } from '../domain/model/behavior-pattern-type.enum';
import { EatingBehaviorPattern } from '../domain/model/eating-behavior-pattern.entity';
import {
  EatingBehaviorPatternResource,
  EatingBehaviorPatternResponse,
} from './eating-behavior-pattern-resource';

/**
 * Converts between {@link EatingBehaviorPattern} domain entities and the API wire format.
 */
export class EatingBehaviorPatternAssembler implements BaseAssembler<
  EatingBehaviorPattern,
  EatingBehaviorPatternResource,
  EatingBehaviorPatternResponse
> {
  /**
   * Maps a raw API resource to an {@link EatingBehaviorPattern} entity.
   *
   * @param resource - Raw API resource object.
   * @returns The constructed domain entity.
   */
  toEntityFromResource(resource: EatingBehaviorPatternResource): EatingBehaviorPattern {
    return new EatingBehaviorPattern({
      id:                   resource.id ? Number(resource.id) : undefined,
      userId:               Number(resource.userId),
      weeklyCompletionRate: resource.weeklyCompletionRate,
      currentStreak:        resource.currentStreak,
      consecutiveMisses:    resource.consecutiveMisses,
      patternType:          resource.patternType as BehaviorPatternType,
      analyzedAt:           resource.analyzedAt,
    });
  }

  /**
   * Serialises an {@link EatingBehaviorPattern} entity to an API resource DTO.
   *
   * @param entity - The domain entity to serialise.
   * @returns The API resource representation.
   */
  toResourceFromEntity(entity: EatingBehaviorPattern): EatingBehaviorPatternResource {
    return {
      id:                   entity.id,
      userId:               entity.userId,
      weeklyCompletionRate: entity.weeklyCompletionRate,
      currentStreak:        entity.currentStreak,
      consecutiveMisses:    entity.consecutiveMisses,
      patternType:          entity.patternType,
      analyzedAt:           entity.analyzedAt,
    };
  }

  /**
   * Extracts all entities from the API response envelope.
   *
   * @param response - The full API response envelope.
   * @returns Array of {@link EatingBehaviorPattern} entities.
   */
  toEntitiesFromResponse(response: EatingBehaviorPatternResponse): EatingBehaviorPattern[] {
    return response.eatingBehaviorPatterns.map(r => this.toEntityFromResource(r));
  }
}
