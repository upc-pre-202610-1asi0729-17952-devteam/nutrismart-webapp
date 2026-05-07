import { inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { delay, tap } from 'rxjs/operators';
import { MOCK_USER } from '../../shared/infrastructure/auth.mock';
import { ActivityLevel } from '../domain/model/activity-level.enum';
import { DietaryRestriction } from '../domain/model/dietary-restriction.enum';
import { SubscriptionPlan } from '../domain/model/subscription-plan.enum';
import { UserGoal } from '../domain/model/user-goal.enum';
import { User } from '../domain/model/user.entity';
import { IamApi } from '../infrastructure/iam-api';

/**
 * Builds the initial {@link User} entity from the {@link MOCK_USER} constant.
 *
 * @returns A fully initialised {@link User} domain entity seeded with mock data.
 */
function buildMockUser(): User {
  return new User({
    id: MOCK_USER.id,
    firstName: MOCK_USER.firstName,
    lastName: MOCK_USER.lastName,
    email: MOCK_USER.email,
    goal: MOCK_USER.goal as UserGoal,
    weight: MOCK_USER.weight,
    height: MOCK_USER.height,
    activityLevel: MOCK_USER.activityLevel as ActivityLevel,
    plan: MOCK_USER.plan as SubscriptionPlan,
    restrictions: MOCK_USER.restrictions as DietaryRestriction[],
    medicalConditions: MOCK_USER.medicalConditions,
    dailyCalorieTarget: MOCK_USER.dailyCalorieTarget,
    proteinTarget: MOCK_USER.proteinTarget,
    carbsTarget: MOCK_USER.carbsTarget,
    fatTarget: MOCK_USER.fatTarget,
    fiberTarget: MOCK_USER.fiberTarget,
    streak: MOCK_USER.streak,
    consecutiveMisses: MOCK_USER.consecutiveMisses,
  });
}

/**
 * Central state store for the IAM bounded context.
 *
 * Manages authentication state and the current user using Angular signals.
 * During Sprint 2, login/register use mock data; the IAM API is wired in
 * for real persistence once the backend is ready.
 *
 * Provided in root so a single instance is shared across the application.
 */
@Injectable({ providedIn: 'root' })
export class IamStore {
  /** API facade for HTTP operations on user resources. */
  private iamApi = inject(IamApi);

  /** Angular router used for post-auth navigation. */
  private router = inject(Router);

  /** Currently authenticated user, or `null` when logged out. */
  private _currentUser = signal<User | null>(buildMockUser());

  /** Whether the user has an active session. */
  private _isAuthenticated = signal<boolean>(true);

  /** Whether an async operation (login, register) is in flight. */
  private _loading = signal<boolean>(false);

  /** Last error message from a failed async operation, or `null`. */
  private _error = signal<string | null>(null);

  // ─── Public readonly signals ───────────────────────────────────────────────

  /**
   * Read-only signal exposing the currently authenticated {@link User}.
   * Emits `null` when no user is logged in.
   */
  readonly currentUser = this._currentUser.asReadonly();

  /**
   * Read-only signal indicating whether the user is authenticated.
   */
  readonly isAuthenticated = this._isAuthenticated.asReadonly();

  /**
   * Read-only signal indicating whether an async operation is in progress.
   */
  readonly loading = this._loading.asReadonly();

  /**
   * Read-only signal holding the most recent error message, or `null`.
   */
  readonly error = this._error.asReadonly();

  // ─── Authentication methods ────────────────────────────────────────────────

  /**
   * Attempts to authenticate the user with email and password.
   *
   * In mock mode (Sprint 2): succeeds when email matches {@link MOCK_USER};
   * otherwise returns an error observable. Adds a 500 ms simulated delay.
   *
   * @param email    - The user's email address.
   * @param password - The user's password.
   * @returns Observable emitting the authenticated {@link User} on success.
   */
  login(email: string, password: string): Observable<User> {
    void password; // Password validation will be done server-side in production
    this._loading.set(true);
    this._error.set(null);

    const user = this._currentUser();
    if (user && email === MOCK_USER.email) {
      return of(user).pipe(
        delay(500),
        tap(u => {
          this._isAuthenticated.set(true);
          this._currentUser.set(u);
          this._loading.set(false);
        })
      );
    }

    this._loading.set(false);
    return throwError(() => new Error('Invalid email or password.'));
  }

  /**
   * Registers a new user account and navigates to the onboarding flow.
   *
   * In mock mode: creates a {@link User} entity from the supplied data and
   * returns it without hitting the API. Navigates to `/onboarding` on success.
   *
   * @param data - Registration payload with at minimum firstName, lastName,
   *               email, and password; goal is optional.
   * @returns Observable emitting the newly created {@link User}.
   */
  register(data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    goal?: UserGoal;
  }): Observable<User> {
    this._loading.set(true);
    this._error.set(null);

    const newUser = new User({
      id: Date.now(),
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      goal: data.goal ?? UserGoal.WEIGHT_LOSS,
      weight: 70,
      height: 170,
      activityLevel: ActivityLevel.MODERATE,
      plan: SubscriptionPlan.FREE,
      restrictions: [],
      medicalConditions: [],
      dailyCalorieTarget: 2000,
      proteinTarget: 100,
      carbsTarget: 250,
      fatTarget: 65,
      fiberTarget: 25,
      streak: 0,
      consecutiveMisses: 0,
    });

    return of(newUser).pipe(
      delay(300),
      tap(u => {
        this._currentUser.set(u);
        this._isAuthenticated.set(true);
        this._loading.set(false);
        this.router.navigate(['/onboarding']);
      })
    );
  }

  /**
   * Logs the current user out, clears state, and navigates to the login page.
   */
  logout(): void {
    this._isAuthenticated.set(false);
    this._currentUser.set(null);
    this.router.navigate(['/auth/login']);
  }

  // ─── Profile update methods ────────────────────────────────────────────────

  /**
   * Updates basic profile fields (name and/or email) on the current user.
   *
   * @param updates - Partial object containing the fields to update.
   */
  updateProfile(updates: Partial<{ firstName: string; lastName: string; email: string }>): void {
    const user = this._currentUser();
    if (!user) return;

    if (updates.firstName !== undefined) user.firstName = updates.firstName;
    if (updates.lastName !== undefined) user.lastName = updates.lastName;
    if (updates.email !== undefined) user.email = updates.email;

    this._currentUser.set(user);
  }

  /**
   * Updates the user's physical attributes and recalculates macro targets.
   *
   * @param w     - New body weight in kilograms.
   * @param h     - New height in centimetres.
   * @param level - New activity level.
   */
  updatePhysicalDetails(w: number, h: number, level: ActivityLevel): void {
    const user = this._currentUser();
    if (!user) return;

    user.weight = w;
    user.height = h;
    user.activityLevel = level;
    user.recalculateMacros();

    this._currentUser.set(user);
  }

  /**
   * Changes the user's fitness goal and recalculates macro targets accordingly.
   *
   * @param goal - The new {@link UserGoal}.
   */
  changeGoal(goal: UserGoal): void {
    const user = this._currentUser();
    if (!user) return;

    user.goal = goal;
    user.recalculateMacros();

    this._currentUser.set(user);
  }

  /**
   * Adds a dietary restriction to the current user via the entity method.
   *
   * @param r - The {@link DietaryRestriction} to add.
   */
  addRestriction(r: DietaryRestriction): void {
    const user = this._currentUser();
    if (!user) return;

    user.addRestriction(r);
    this._currentUser.set(user);
  }

  /**
   * Removes a dietary restriction from the current user via the entity method.
   *
   * @param r - The {@link DietaryRestriction} to remove.
   */
  removeRestriction(r: DietaryRestriction): void {
    const user = this._currentUser();
    if (!user) return;

    user.removeRestriction(r);
    this._currentUser.set(user);
  }

  /**
   * Adds a medical condition to the current user via the entity method.
   *
   * @param c - The medical condition description to add.
   */
  addMedicalCondition(c: string): void {
    const user = this._currentUser();
    if (!user) return;

    user.addMedicalCondition(c);
    this._currentUser.set(user);
  }

  /**
   * Removes a medical condition from the current user via the entity method.
   *
   * @param c - The medical condition description to remove.
   */
  removeMedicalCondition(c: string): void {
    const user = this._currentUser();
    if (!user) return;

    user.removeMedicalCondition(c);
    this._currentUser.set(user);
  }

  /**
   * Upgrades (or downgrades) the user's subscription plan.
   *
   * @param plan - The new {@link SubscriptionPlan} to apply.
   */
  upgradePlan(plan: SubscriptionPlan): void {
    const user = this._currentUser();
    if (!user) return;

    user.plan = plan;
    this._currentUser.set(user);
  }
}
