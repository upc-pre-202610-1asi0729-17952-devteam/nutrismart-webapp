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
  /** Date of birth in ISO format (YYYY-MM-DD). */
  birthday?: string;
  /** Biological sex string ('male' | 'female' | 'other'). */
  biologicalSex?: string;
  /** Account creation date in ISO format (YYYY-MM-DD). */
  createdAt?: string;
  /** City the user considers home, used for travel detection. */
  homeCity?: string;
  /** ISO date when the current goal was started. */
  goalStartedAt?: string;
  /** Number of consecutive days meeting the behavioral goal. */
  streak?: number;
  /** Number of consecutive days missing the behavioral goal. */
  consecutiveMisses?: number;
  /** JWT token returned by the authentication endpoint (never sent back to the API). */
  token?: string;
  /** Password for user creation — write-only, never returned by the API. */
  password?: string;
  /** ISO date (YYYY-MM-DD) when cancelled-plan access expires. Null when no pending expiry. */
  planExpiresAt?: string | null;
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

/**
 * Response shape returned by the `POST /auth/login` endpoint.
 *
 * Only contains the authentication token and the minimal identity fields
 * needed to fetch the full profile. All other user data must be loaded via
 * `GET /users/{userId}`.
 */
export interface LoginResponse {
  /** JWT access token. */
  token: string;
  /** Numeric identifier of the authenticated user. */
  userId: number;
  /** User's email address. */
  email: string;
  /** User's given name. */
  firstName: string;
  /** User's family name. */
  lastName: string;
  /** Fitness goal as a raw string (e.g. `"WEIGHT_LOSS"`). */
  goal: string;
  /** Subscription plan as a raw string (e.g. `"BASIC"`), or null. */
  plan: string | null;
}
