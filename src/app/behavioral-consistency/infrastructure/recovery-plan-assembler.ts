import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { AdherenceDropTrigger } from '../domain/model/adherence-drop-trigger.enum';
import { RecoveryAction } from '../domain/model/recovery-action.value-object';
import { RecoveryActionType } from '../domain/model/recovery-action-type.enum';
import { RecoveryPlan } from '../domain/model/recovery-plan.entity';
import { RecoveryPlanStatus } from '../domain/model/recovery-plan-status.enum';
import { RecoveryPlanResource, RecoveryPlanResponse } from './recovery-plan-resource';

/**
 * Converts between {@link RecoveryPlan} domain entities and the API wire format.
 */
export class RecoveryPlanAssembler implements BaseAssembler<
  RecoveryPlan,
  RecoveryPlanResource,
  RecoveryPlanResponse
> {
  /**
   * Maps a raw API resource to a {@link RecoveryPlan} entity.
   *
   * @param resource - Raw API resource object.
   * @returns The constructed domain entity.
   */
  toEntityFromResource(resource: RecoveryPlanResource): RecoveryPlan {
    return new RecoveryPlan({
      id:          resource.id ?? undefined,
      userId:      resource.userId as number,
      trigger:     resource.trigger as AdherenceDropTrigger,
      status:      resource.status as RecoveryPlanStatus,
      actions:     (resource.actions ?? []).map(a => new RecoveryAction({
        type:           a.type as RecoveryActionType,
        descriptionKey: a.descriptionKey,
        priority:       a.priority,
      })),
      activatedAt: resource.activatedAt,
      resolvedAt:  resource.resolvedAt ?? null,
    });
  }

  /**
   * Serialises a {@link RecoveryPlan} entity to an API resource DTO.
   *
   * @param entity - The domain entity to serialise.
   * @returns The API resource representation.
   */
  toResourceFromEntity(entity: RecoveryPlan): RecoveryPlanResource {
    return {
      id:          entity.id,
      userId:      entity.userId,
      trigger:     entity.trigger,
      status:      entity.status,
      actions:     entity.actions.map(a => a.toJSON()),
      activatedAt: entity.activatedAt,
      resolvedAt:  entity.resolvedAt,
    };
  }

  /**
   * Extracts all entities from the API response envelope.
   *
   * @param response - The full API response envelope.
   * @returns Array of {@link RecoveryPlan} entities.
   */
  toEntitiesFromResponse(response: RecoveryPlanResponse): RecoveryPlan[] {
    return response.recoveryPlans.map(r => this.toEntityFromResource(r));
  }
}
