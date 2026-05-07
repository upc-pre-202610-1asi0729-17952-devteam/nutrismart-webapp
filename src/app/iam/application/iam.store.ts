import { inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { ActivityLevel } from '../domain/model/activity-level.enum';
import { DietaryRestriction } from '../domain/model/dietary-restriction.enum';
import { MedicalCondition } from '../domain/model/medical-condition.enum';
import { SubscriptionPlan } from '../domain/model/subscription-plan.enum';
import { UserGoal } from '../domain/model/user-goal.enum';
import { User, UserProps } from '../domain/model/user.entity';
import { IamApi } from '../infrastructure/iam-api';

const SESSION_KEY = 'nutrismart_session';

/**
 * Central state store for the IAM bounded context.
 *
 * Manages authentication state and the current user using Angular signals.
 * All mutations are persisted to the json-server backend via {@link IamApi}.
 *
 * Provided in root so a single instance is shared across the application.
 */
@Injectable({ providedIn: 'root' })
export class IamStore {
  /** API façade for HTTP operations on user resources. */
  private iamApi = inject(IamApi);

  /** Angular router used for post-auth navigation. */
  private router = inject(Router);

  /** Currently authenticated user, or `null` when logged out. */
  private _currentUser = signal<User | null>(null);

  /** Whether the user has an active session. */
  private _isAuthenticated = signal<boolean>(false);

  /** Whether an async operation is in flight. */
  private _loading = signal<boolean>(false);

  /** Last error message from a failed async operation, or `null`. */
  private _error = signal<string | null>(null);

  constructor() {
    this.restoreSession();
  }

  // ─── Public readonly signals ───────────────────────────────────────────────

  /** Read-only signal exposing the currently authenticated {@link User}. */
  readonly currentUser = this._currentUser.asReadonly();

  /** Read-only signal indicating whether the user is authenticated. */
  readonly isAuthenticated = this._isAuthenticated.asReadonly();

  /** Read-only signal indicating whether an async operation is in progress. */
  readonly loading = this._loading.asReadonly();

  /** Read-only signal holding the most recent error message, or `null`. */
  readonly error = this._error.asReadonly();

  // ─── Session persistence ───────────────────────────────────────────────────

  private saveSession(user: User): void {
    const props: UserProps = {
      id: user.id, firstName: user.firstName, lastName: user.lastName,
      email: user.email, goal: user.goal, weight: user.weight, height: user.height,
      activityLevel: user.activityLevel, plan: user.plan,
      restrictions: user.restrictions, medicalConditions: user.medicalConditions,
      dailyCalorieTarget: user.dailyCalorieTarget, proteinTarget: user.proteinTarget,
      carbsTarget: user.carbsTarget, fatTarget: user.fatTarget,
      fiberTarget: user.fiberTarget, streak: user.streak,
      consecutiveMisses: user.consecutiveMisses,
      birthday: user.birthday, biologicalSex: user.biologicalSex,
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(props));
  }

  private clearSession(): void {
    localStorage.removeItem(SESSION_KEY);
  }

  private restoreSession(): void {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return;
      const props = JSON.parse(raw) as UserProps;
      this._currentUser.set(new User(props));
      this._isAuthenticated.set(true);
    } catch {
      this.clearSession();
    }
  }

  // ─── Authentication ────────────────────────────────────────────────────────

  /**
   * Authenticates the user by fetching all users from the API and finding
   * the one matching the supplied email. Password validation is deferred to
   * the production backend.
   *
   * @param email    - The user's email address.
   * @param password - The user's password (reserved for server-side validation).
   * @returns Observable emitting the authenticated {@link User} on success.
   */
  login(email: string, password: string): Observable<User> {
    void password;
    this._loading.set(true);
    this._error.set(null);

    return this.iamApi.getUsers().pipe(
      map(users => {
        const user = users.find(u => u.email === email);
        if (!user) throw new Error('Invalid email or password.');
        return user;
      }),
      tap(user => {
        this._currentUser.set(user);
        this._isAuthenticated.set(true);
        this._loading.set(false);
        this.saveSession(user);
        const incomplete = !user.birthday || !user.biologicalSex;
        if (incomplete) this.router.navigate(['/onboarding']);
        else if (!user.plan) this.router.navigate(['/subscription']);
        else this.router.navigate(['/dashboard']);
      }),
      catchError(err => {
        this._loading.set(false);
        this._error.set(err.message);
        return throwError(() => err);
      })
    );
  }

  /**
   * Creates a new user account via the API and navigates to the onboarding flow.
   *
   * @param data - Registration payload (firstName, lastName, email, password, optional goal).
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
      plan: null,
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

    return this.iamApi.createUser(newUser).pipe(
      tap(created => {
        this._currentUser.set(created);
        this._isAuthenticated.set(true);
        this._loading.set(false);
        this.saveSession(created);
        this.router.navigate(['/onboarding']);
      }),
      catchError(err => {
        this._loading.set(false);
        this._error.set(err.message);
        return throwError(() => err);
      })
    );
  }

  /**
   * Logs the current user out, clears all state, and navigates to login.
   */
  logout(): void {
    this._isAuthenticated.set(false);
    this._currentUser.set(null);
    this.clearSession();
    this.router.navigate(['/auth/login']);
  }

  // ─── Private helpers ───────────────────────────────────────────────────────

  /**
   * Persists the current user state to the API via a full PUT replacement.
   * Called after every local mutation to keep the backend in sync.
   */
  private persist(): void {
    const user = this._currentUser();
    if (!user) return;
    this.iamApi.updateUser(user).subscribe({
      next: updated => {
        this._currentUser.set(updated);
        this.saveSession(updated);
      },
      error: err => this._error.set(err.message),
    });
  }

  // ─── Profile update methods ────────────────────────────────────────────────

  /**
   * Updates basic profile fields and persists the change.
   *
   * @param updates - Partial object with firstName, lastName and/or email.
   */
  updateProfile(updates: Partial<{ firstName: string; lastName: string; email: string; birthday: string; biologicalSex: string }>): void {
    const user = this._currentUser();
    if (!user) return;
    if (updates.firstName !== undefined) user.firstName = updates.firstName;
    if (updates.lastName !== undefined) user.lastName = updates.lastName;
    if (updates.email !== undefined) user.email = updates.email;
    if (updates.birthday !== undefined) user.birthday = updates.birthday;
    if (updates.biologicalSex !== undefined) user.biologicalSex = updates.biologicalSex;
    this._currentUser.set(user);
    this.persist();
  }

  /**
   * Updates physical attributes, recalculates macros, and persists.
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
    this.persist();
  }

  /**
   * Changes the fitness goal, recalculates macros, and persists.
   *
   * @param goal - The new {@link UserGoal}.
   */
  changeGoal(goal: UserGoal): void {
    const user = this._currentUser();
    if (!user) return;
    user.goal = goal;
    user.recalculateMacros();
    this._currentUser.set(user);
    this.persist();
  }

  /**
   * Adds a dietary restriction and persists.
   *
   * @param r - The {@link DietaryRestriction} to add.
   */
  addRestriction(r: DietaryRestriction): void {
    const user = this._currentUser();
    if (!user) return;
    user.addRestriction(r);
    this._currentUser.set(user);
    this.persist();
  }

  /**
   * Removes a dietary restriction and persists.
   *
   * @param r - The {@link DietaryRestriction} to remove.
   */
  removeRestriction(r: DietaryRestriction): void {
    const user = this._currentUser();
    if (!user) return;
    user.removeRestriction(r);
    this._currentUser.set(user);
    this.persist();
  }

  /**
   * Adds a free-text medical condition and persists.
   *
   * @param c - The condition string to add.
   */
  addMedicalCondition(c: string): void {
    const user = this._currentUser();
    if (!user) return;
    user.addMedicalCondition(c);
    this._currentUser.set(user);
    this.persist();
  }

  /**
   * Adds a {@link MedicalCondition} enum value and persists.
   *
   * @param condition - The {@link MedicalCondition} to add.
   */
  addMedicalConditionEnum(condition: MedicalCondition): void {
    this.addMedicalCondition(condition as string);
  }

  /**
   * Removes a medical condition and persists.
   *
   * @param c - The condition string to remove.
   */
  removeMedicalCondition(c: string): void {
    const user = this._currentUser();
    if (!user) return;
    user.removeMedicalCondition(c);
    this._currentUser.set(user);
    this.persist();
  }

  /**
   * Replaces all dietary restrictions and persists.
   *
   * @param restrictions - New set of {@link DietaryRestriction} values.
   */
  setRestrictions(restrictions: DietaryRestriction[]): void {
    const user = this._currentUser();
    if (!user) return;
    user.restrictions = restrictions;
    this._currentUser.set(user);
    this.persist();
  }

  /**
   * Replaces all medical conditions and persists.
   *
   * @param conditions - New array of condition strings (enum values).
   */
  setMedicalConditions(conditions: string[]): void {
    const user = this._currentUser();
    if (!user) return;
    user.medicalConditions = conditions;
    this._currentUser.set(user);
    this.persist();
  }

  /**
   * Upgrades the subscription plan and persists.
   *
   * @param plan - The new {@link SubscriptionPlan}.
   */
  upgradePlan(plan: SubscriptionPlan): void {
    const user = this._currentUser();
    if (!user) return;
    user.plan = plan;
    this._currentUser.set(user);
    this.persist();
  }
}
