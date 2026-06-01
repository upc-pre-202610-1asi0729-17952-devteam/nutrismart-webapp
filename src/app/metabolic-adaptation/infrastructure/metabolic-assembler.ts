import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { BodyMetric } from '../domain/model/body-metric.entity';
import { BodyComposition } from '../domain/model/body-composition.entity';
import {
  BodyMetricResource, BodyMetricsResponse,
  BodyCompositionResource, BodyCompositionResponse,
} from './metabolic-resource';

/**
 * Assembler for {@link BodyMetric} — maps between the body-metrics API DTO
 * and the domain entity.
 *
 * @author Espinoza Cruz, Angela Milagros
 */
export class BodyMetricAssembler
  implements BaseAssembler<BodyMetric, BodyMetricResource, BodyMetricsResponse> {

  toEntityFromResource(r: BodyMetricResource): BodyMetric {
    return new BodyMetric({
      id:                       r.id,
      userId:                   r.userId as number,
      weightKg:                 r.weightKg,
      heightCm:                 r.heightCm,
      loggedAt:                 r.loggedAt,
      targetWeightKg:           r.targetWeightKg,
      projectedAchievementDate: r.projectedAchievementDate,
    });
  }

  toResourceFromEntity(e: BodyMetric): BodyMetricResource {
    return {
      id:                       e.id,
      userId:                   e.userId,
      weightKg:                 e.weightKg,
      heightCm:                 e.heightCm,
      loggedAt:                 e.loggedAt,
      targetWeightKg:           e.targetWeightKg,
      projectedAchievementDate: e.projectedAchievementDate,
    };
  }

  toEntitiesFromResponse(response: BodyMetricsResponse): BodyMetric[] {
    return response.metrics.map(r => this.toEntityFromResource(r));
  }
}

/**
 * Assembler for {@link BodyComposition} — maps between the composition API DTO
 * and the domain entity.
 *
 * @author Espinoza Cruz, Angela Milagros
 */
export class BodyCompositionAssembler
  implements BaseAssembler<BodyComposition, BodyCompositionResource, BodyCompositionResponse> {

  toEntityFromResource(r: BodyCompositionResource): BodyComposition {
    return new BodyComposition({
      id:                       r.id,
      userId:                   r.userId as number,
      waistCm:                  r.waist_cm,
      neckCm:                   r.neck_cm,
      heightCm:                 r.height_cm,
      weightKg:                 r.weight_kg,
      measuredAt:               r.measured_at,
      previousBodyFatPercent:   r.previous_body_fat_percent,
      overrideBodyFatPercent:   r.override_body_fat_percent,
    });
  }

  toResourceFromEntity(e: BodyComposition): BodyCompositionResource {
    return {
      id:                         e.id,
      userId:                     e.userId,
      waist_cm:                   e.waistCm,
      neck_cm:                    e.neckCm,
      height_cm:                  e.heightCm,
      weight_kg:                  e.weightKg,
      measured_at:                e.measuredAt,
      previous_body_fat_percent:  e.previousBodyFatPercent,
      override_body_fat_percent:  e.overrideBodyFatPercent,
    };
  }

  toEntitiesFromResponse(response: BodyCompositionResponse): BodyComposition[] {
    return [this.toEntityFromResource(response.composition)];
  }
}

