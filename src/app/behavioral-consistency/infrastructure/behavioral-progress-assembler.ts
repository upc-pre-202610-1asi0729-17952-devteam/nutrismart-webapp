import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { AdherenceStatus } from '../domain/model/adherence-status.enum';
import { BehavioralProgress } from '../domain/model/behavioral-progress.entity';
import {
  BehavioralProgressResource,
  BehavioralProgressResponse,
} from './behavioral-progress-resource';

/**
 * Converts between the {@link BehavioralProgress} domain entity and the API wire format.
 *
 * The API stores enum-like values as strings, while the domain model uses
 * strongly typed enums.
 */
export class BehavioralProgressAssembler implements BaseAssembler<
  BehavioralProgress,
  BehavioralProgressResource,
  BehavioralProgressResponse
> {
  /**
   * Maps a single {@link BehavioralProgressResource} received from the API
   * to a {@link BehavioralProgress} domain entity.
   *
   * @param resource - Raw API resource object.
   * @returns The constructed {@link BehavioralProgress} domain entity.
   */
  toEntityFromResource(resource: BehavioralProgressResource): BehavioralProgress {
    return new BehavioralProgress({
      id:               resource.id ?? undefined,
      userId:           resource.userId as number,
      adherenceStatus:  resource.adherenceStatus as AdherenceStatus,
      streak:           resource.streak,
      consecutiveMisses: resource.consecutiveMisses,
      lastGoalMetDate:  resource.lastGoalMetDate,
      goalMetDates:     [...(resource.goalMetDates ?? [])],
    });
  }

  /**
   * Serialises a {@link BehavioralProgress} domain entity to a
   * {@link BehavioralProgressResource} suitable for POST / PUT requests.
   *
   * @param entity - The domain entity to serialise.
   * @returns The API resource representation.
   */
  toResourceFromEntity(entity: BehavioralProgress): BehavioralProgressResource {
    return {
      id: entity.id,
      userId: entity.userId,
      adherenceStatus: entity.adherenceStatus,
      streak: entity.streak,
      consecutiveMisses: entity.consecutiveMisses,
      lastGoalMetDate: entity.lastGoalMetDate,
      goalMetDates: entity.goalMetDates,
    };
  }

  /**
   * Extracts all behavioral progress entities from the API response envelope.
   *
   * @param response - The full {@link BehavioralProgressResponse} envelope.
   * @returns An array of {@link BehavioralProgress} domain entities.
   */
  toEntitiesFromResponse(response: BehavioralProgressResponse): BehavioralProgress[] {
    return response.behavioralProgress.map(resource =>
      this.toEntityFromResource(resource)
    );
  }
}
