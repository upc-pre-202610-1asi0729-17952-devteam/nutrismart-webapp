import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { LocationSnapshot } from '../domain/model/location-snapshot.entity';
import { WeatherContext } from '../domain/model/weather-context.entity';
import { TravelContext } from '../domain/model/travel-context.entity';
import { RecommendationSession } from '../domain/model/recommendation-session.entity';
import { AdherenceStatus } from '../domain/model/adherence-status.enum';
import { WeatherType } from '../domain/model/weather-type.enum';
import {
  LocationSnapshotResource,
  WeatherContextResource, WeatherContextResponse,
  TravelContextResource, TravelContextResponse,
  RecommendationSessionResource, RecommendationSessionResponse,
} from './recommendations-resource';

export class LocationSnapshotAssembler {
  toEntityFromResource(r: LocationSnapshotResource): LocationSnapshot {
    return new LocationSnapshot({
      id:         typeof r.id === 'string' ? 0 : r.id as number,
      userId:     typeof r.userId === 'string' ? parseInt(r.userId, 10) : r.userId as unknown as number,
      city:       r.city,
      country:    r.country,
      recordedAt: r.recordedAt,
    });
  }
}

export class WeatherContextAssembler
  implements BaseAssembler<WeatherContext, WeatherContextResource, WeatherContextResponse> {

  toEntityFromResource(r: WeatherContextResource): WeatherContext {
    return new WeatherContext({
      id:                 typeof r.id === 'string' ? 0 : r.id as number,
      snapshotId:         String(r.id),
      city:               r.city,
      country:            r.country,
      temperatureCelsius: r.temperatureCelsius,
      condition:          r.condition,
      weatherType:        r.weatherType as WeatherType,
      updatedAt:          r.updatedAt,
    });
  }

  toResourceFromEntity(e: WeatherContext): WeatherContextResource {
    return {
      id:                 e.id,
      city:               e.city,
      country:            e.country,
      temperatureCelsius: e.temperatureCelsius,
      condition:          e.condition,
      weatherType:        e.weatherType,
      updatedAt:          e.updatedAt,
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
      id:          typeof r.id === 'string' ? 0 : r.id as number,
      userId:      r.userId,
      city:        r.city,
      country:     r.country,
      isActive:    r.isActive,
      isManual:    r.isManual,
      activatedAt: r.activatedAt,
    });
  }

  toResourceFromEntity(e: TravelContext): TravelContextResource {
    return {
      id:          e.id,
      userId:      String(e.userId),
      city:        e.city,
      country:     e.country,
      isActive:    e.isActive,
      isManual:    e.isManual,
      activatedAt: e.activatedAt,
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
      id:                   typeof r.id === 'string' ? 0 : r.id as number,
      userId:               typeof r.userId === 'string' ? parseInt(r.userId, 10) : r.userId as unknown as number,
      adherenceStatus:      r.adherenceStatus as AdherenceStatus,
      consecutiveMisses:    r.consecutiveMisses,
      simplifiedKcalTarget: r.simplifiedKcalTarget,
      createdAt:            r.createdAt,
      isActive:             r.isActive,
      weatherSnapshotId:    r.weatherSnapshotId ?? null,
    });
  }

  toResourceFromEntity(e: RecommendationSession): RecommendationSessionResource {
    return {
      id:                   e.id,
      userId:               String(e.userId),
      adherenceStatus:      e.adherenceStatus,
      consecutiveMisses:    e.consecutiveMisses,
      simplifiedKcalTarget: e.simplifiedKcalTarget,
      createdAt:            e.createdAt,
      isActive:             e.isActive,
      weatherSnapshotId:    e.weatherSnapshotId,
    };
  }

  toEntitiesFromResponse(response: RecommendationSessionResponse): RecommendationSession[] {
    return [this.toEntityFromResource(response.session)];
  }
}
