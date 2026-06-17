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
      id:                   resource.id ?? undefined,
      userId:               resource.userId as number,
      weeklyCompletionRate: 0,
      currentStreak:        0,
      consecutiveMisses:    0,
      patternType:          (resource.patternType ?? BehaviorPatternType.IRREGULAR) as BehaviorPatternType,
      analyzedAt:           resource.detectedAt ?? new Date().toISOString().slice(0, 10),
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
      streak:               entity.currentStreak,
      patternType:          entity.patternType,
      detectedAt:           entity.analyzedAt,
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
