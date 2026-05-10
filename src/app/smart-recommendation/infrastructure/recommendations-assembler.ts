import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { WeatherContext } from '../domain/model/weather-context.entity';
import { TravelContext } from '../domain/model/travel-context.entity';
import { RecommendationSession } from '../domain/model/recommendation-session.entity';
import { AdherenceStatus } from '../domain/model/adherence-status.enum';
import { WeatherType } from '../domain/model/weather-type.enum';
import {
  WeatherContextResource, WeatherContextResponse,
  TravelContextResource, TravelContextResponse,
  RecommendationSessionResource, RecommendationSessionResponse,
} from './recommendations-resource';

export class WeatherContextAssembler
  implements BaseAssembler<WeatherContext, WeatherContextResource, WeatherContextResponse> {

  toEntityFromResource(r: WeatherContextResource): WeatherContext {
    return new WeatherContext({
      id:                 r.id,
      city:               r.city,
      country:            r.country,
      temperatureCelsius: r.temperature_celsius,
      condition:          r.condition,
      weatherType:        r.weather_type as WeatherType,
      updatedAt:          r.updated_at,
    });
  }

  toResourceFromEntity(e: WeatherContext): WeatherContextResource {
    return {
      id:                  e.id,
      city:                e.city,
      country:             e.country,
      temperature_celsius: e.temperatureCelsius,
      condition:           e.condition,
      weather_type:        e.weatherType,
      updated_at:          e.updatedAt,
    };
  }

  toEntitiesFromResponse(response: WeatherContextResponse): WeatherContext[] {
    return [this.toEntityFromResource(response.weather)];
  }
}

export class TravelContextAssembler
  implements BaseAssembler<TravelContext, TravelContextResource, TravelContextResponse> {

  toEntityFromResource(r: TravelContextResource): TravelContext {
    return new TravelContext({
      id:          r.id,
      city:        r.city,
      country:     r.country,
      isActive:    r.is_active,
      isManual:    r.is_manual,
      activatedAt: r.activated_at,
    });
  }

  toResourceFromEntity(e: TravelContext): TravelContextResource {
    return {
      id:           e.id,
      city:         e.city,
      country:      e.country,
      is_active:    e.isActive,
      is_manual:    e.isManual,
      activated_at: e.activatedAt,
    };
  }

  toEntitiesFromResponse(response: TravelContextResponse): TravelContext[] {
    return [this.toEntityFromResource(response.travel)];
  }
}

export class RecommendationSessionAssembler
  implements BaseAssembler<RecommendationSession, RecommendationSessionResource, RecommendationSessionResponse> {

  toEntityFromResource(r: RecommendationSessionResource): RecommendationSession {
    return new RecommendationSession({
      id:                   r.id,
      userId:               r.user_id,
      adherenceStatus:      r.adherence_status as AdherenceStatus,
      consecutiveMisses:    r.consecutive_misses,
      simplifiedKcalTarget: r.simplified_kcal_target,
      createdAt:            r.created_at,
      isActive:             r.is_active,
    });
  }

  toResourceFromEntity(e: RecommendationSession): RecommendationSessionResource {
    return {
      id:                     e.id,
      user_id:                e.userId,
      adherence_status:       e.adherenceStatus,
      consecutive_misses:     e.consecutiveMisses,
      simplified_kcal_target: e.simplifiedKcalTarget,
      created_at:             e.createdAt,
      is_active:              e.isActive,
    };
  }

  toEntitiesFromResponse(response: RecommendationSessionResponse): RecommendationSession[] {
    return [this.toEntityFromResource(response.session)];
  }
}
