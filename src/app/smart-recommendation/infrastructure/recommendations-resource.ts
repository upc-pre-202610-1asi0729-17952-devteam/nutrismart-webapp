import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';
import { AdherenceStatus } from '../domain/model/adherence-status.enum';
import { WeatherType } from '../domain/model/weather-type.enum';

export interface LocationSnapshotResource extends BaseResource {
  userId: string;
  city: string;
  country: string;
  recordedAt: string;
}

export interface WeatherContextResource extends BaseResource {
  city: string;
  country: string;
  temperatureCelsius: number;
  condition: string;
  weatherType: string;
  updatedAt: string;
}

export interface TravelContextResource extends BaseResource {
  userId: string;
  city: string;
  country: string;
  isActive: boolean;
  isManual: boolean;
  activatedAt: string;
}

export interface RecommendationSessionResource extends BaseResource {
  userId: string;
  adherenceStatus: string;
  consecutiveMisses: number;
  simplifiedKcalTarget: number;
  createdAt: string;
  isActive: boolean;
  weatherSnapshotId?: string | null;
}

export interface FoodCardResource {
  id: number | string;
  name: string;
  nameEs?: string;
  caloriesPer100g: number;
  proteinPer100g: number;
}

export interface RecommendationCardResource extends BaseResource {
  foodId: number | string;
  badge: string;
  description: string;
  descriptionEs: string;
  weatherType: string | null;
  travelCity: string | null;
  cardType: string;
}

export interface WeatherContextResponse extends BaseResponse {
  weather: WeatherContextResource;
}

export interface TravelContextResponse extends BaseResponse {
  travel: TravelContextResource;
}

export interface RecommendationSessionResponse extends BaseResponse {
  session: RecommendationSessionResource;
}
