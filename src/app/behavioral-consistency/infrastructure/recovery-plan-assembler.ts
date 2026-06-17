import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { AdherenceDropTrigger } from '../domain/model/adherence-drop-trigger.enum';
import { RecoveryAction, RecoveryActionProps } from '../domain/model/recovery-action.value-object';
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
      actions:     (resource.actions ?? []).map((a, index) => {
        if (typeof a === 'string') {
          return new RecoveryAction({
            type:           a as RecoveryActionType,
            descriptionKey: `behavioral.recovery.action.${a.toLowerCase()}`,
            priority:       index + 1,
          });
        }
        const props = a as RecoveryActionProps;
        return new RecoveryAction({
          type:           props.type as RecoveryActionType,
          descriptionKey: props.descriptionKey,
          priority:       props.priority,
        });
      }),
      activatedAt: resource.createdAt,
      resolvedAt:  resource.expiresAt ?? null,
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
      id:        entity.id,
      userId:    entity.userId,
      trigger:   entity.trigger,
      status:    entity.status,
      actions:   entity.actions.map(a => a.type),
      createdAt: entity.activatedAt,
      expiresAt: entity.resolvedAt ?? new Date(new Date(entity.activatedAt).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
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
