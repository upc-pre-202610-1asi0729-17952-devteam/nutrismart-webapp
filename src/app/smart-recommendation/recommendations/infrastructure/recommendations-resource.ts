import { BaseResource, BaseResponse } from '../../../shared/infrastructure/base-response';
import { AdherenceStatus } from '../domain/model/adherence-status.enum';
import { WeatherType } from '../domain/model/weather-type.enum';

/**
 * API resource DTO for {@link WeatherContext}.
 *
 * @author Espinoza Cruz, Angela Milagros
 */
export interface WeatherContextResource extends BaseResource {
  city: string;
  country: string;
  temperature_celsius: number;
  condition: string;
  weather_type: string;
  updated_at: string;
}

/**
 * API resource DTO for {@link TravelContext}.
 *
 * @author Espinoza Cruz, Angela Milagros
 */
export interface TravelContextResource extends BaseResource {
  city: string;
  country: string;
  is_active: boolean;
  is_manual: boolean;
  activated_at: string;
}

/**
 * API resource DTO for {@link RecommendationSession}.
 *
 * @author Espinoza Cruz, Angela Milagros
 */
export interface RecommendationSessionResource extends BaseResource {
  user_id: number;
  adherence_status: string;
  consecutive_misses: number;
  simplified_kcal_target: number;
  created_at: string;
  is_active: boolean;
}

/** Response envelope for weather context. */
export interface WeatherContextResponse extends BaseResponse {
  weather: WeatherContextResource;
}

/** Response envelope for travel context. */
export interface TravelContextResponse extends BaseResponse {
  travel: TravelContextResource;
}

/** Response envelope for recommendation sessions. */
export interface RecommendationSessionResponse extends BaseResponse {
  session: RecommendationSessionResource;
}
