import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { ActivityLevel } from '../domain/model/activity-level.enum';
import { DietaryRestriction } from '../domain/model/dietary-restriction.enum';
import { SubscriptionPlan } from '../domain/model/subscription-plan.enum';
import { UserGoal } from '../domain/model/user-goal.enum';
import { User } from '../domain/model/user.entity';
import { UserResource, UsersResponse } from './user-resource';

/**
 * Converts between the {@link User} domain entity and the API wire format.
 *
 * Implements {@link BaseAssembler} for the IAM bounded context. String enum
 * values received from the API are cast to their TypeScript enum counterparts
 * when building a domain entity, and cast back to strings when serialising
 * for HTTP requests.
 */
export class UserAssembler implements BaseAssembler<User, UserResource, UsersResponse> {
  /**
   * Maps a single {@link UserResource} received from the API to a {@link User}
   * domain entity, casting all string enum fields to their typed equivalents.
   *
   * @param resource - Raw API resource object.
   * @returns The constructed {@link User} domain entity.
   */
  toEntityFromResource(resource: UserResource): User {
    return new User({
      id: resource.id,
      firstName: resource.firstName,
      lastName: resource.lastName,
      email: resource.email,
      goal: resource.goal as UserGoal,
      weight: resource.weight,
      height: resource.height,
      activityLevel: resource.activityLevel as ActivityLevel,
      plan: resource.plan ? resource.plan as SubscriptionPlan : null,
      restrictions: resource.restrictions.map(r => r as DietaryRestriction),
      medicalConditions: resource.medicalConditions,
      dailyCalorieTarget: resource.dailyCalorieTarget,
      proteinTarget: resource.proteinTarget,
      carbsTarget: resource.carbsTarget,
      fatTarget: resource.fatTarget,
      fiberTarget: resource.fiberTarget,
      streak: resource.streak,
      consecutiveMisses: resource.consecutiveMisses,
      birthday: resource.birthday ?? '',
      biologicalSex: resource.biologicalSex ?? '',
    });
  }

  /**
   * Serialises a {@link User} domain entity to a {@link UserResource} suitable
   * for sending in POST / PUT request bodies.
   *
   * @param entity - The domain entity to serialise.
   * @returns The API resource representation.
   */
  toResourceFromEntity(entity: User): UserResource {
    return {
      id: entity.id,
      firstName: entity.firstName,
      lastName: entity.lastName,
      email: entity.email,
      goal: entity.goal,
      weight: entity.weight,
      height: entity.height,
      activityLevel: entity.activityLevel,
      plan: entity.plan,
      restrictions: entity.restrictions,
      medicalConditions: entity.medicalConditions,
      dailyCalorieTarget: entity.dailyCalorieTarget,
      proteinTarget: entity.proteinTarget,
      carbsTarget: entity.carbsTarget,
      fatTarget: entity.fatTarget,
      fiberTarget: entity.fiberTarget,
      streak: entity.streak,
      consecutiveMisses: entity.consecutiveMisses,
      birthday: entity.birthday,
      biologicalSex: entity.biologicalSex,
    };
  }

  /**
   * Extracts all user entities from the API response envelope.
   *
   * @param response - The full {@link UsersResponse} envelope from the API.
   * @returns An array of {@link User} domain entities.
   */
  toEntitiesFromResponse(response: UsersResponse): User[] {
    return response.users.map(r => this.toEntityFromResource(r));
  }
}
