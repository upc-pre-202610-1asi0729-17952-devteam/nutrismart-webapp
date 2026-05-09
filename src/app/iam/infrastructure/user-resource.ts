import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';

/**
 * API resource DTO representing a user as returned by the REST endpoint.
 *
 * All enum-typed fields are stored as plain strings on the wire; the
 * {@link UserAssembler} is responsible for casting them to the correct
 * domain enum values when building a {@link User} entity.
 */
export interface UserResource extends BaseResource {
  /** Unique numeric identifier. */
  id: number;
  /** User's given name. */
  firstName: string;
  /** User's family name. */
  lastName: string;
  /** User's email address. */
  email: string;
  /** Fitness goal as a raw string (e.g. `"WEIGHT_LOSS"`). */
  goal: string;
  /** Body weight in kilograms. */
  weight: number;
  /** Height in centimetres. */
  height: number;
  /** Activity level as a raw string (e.g. `"MODERATE"`). */
  activityLevel: string;
  /** Subscription plan as a raw string (e.g. `"PRO"`), or null when not yet chosen. */
  plan: string | null;
  /** Array of active restriction strings (e.g. `["LACTOSE_FREE"]`). */
  restrictions: string[];
  /** Free-text medical conditions. */
  medicalConditions: string[];
  /** Daily calorie target in kcal. */
  dailyCalorieTarget: number;
  /** Daily protein target in grams. */
  proteinTarget: number;
  /** Daily carbohydrate target in grams. */
  carbsTarget: number;
  /** Daily fat target in grams. */
  fatTarget: number;
  /** Daily fibre target in grams. */
  fiberTarget: number;
  /** Consecutive on-track days. */
  streak: number;
  /** Consecutive missed days. */
  consecutiveMisses: number;
  /** Date of birth in ISO format (YYYY-MM-DD). */
  birthday?: string;
  /** Biological sex string ('male' | 'female' | 'other'). */
  biologicalSex?: string;
  /** Account creation date in ISO format (YYYY-MM-DD). */
  createdAt?: string;
}

/**
 * Envelope returned by the `/users` collection endpoint.
 *
 * Wraps an array of {@link UserResource} objects so the assembler can
 * extract them via {@link UserAssembler.toEntitiesFromResponse}.
 */
export interface UsersResponse extends BaseResponse {
  /** Array of user resources returned by the API. */
  users: UserResource[];
}
