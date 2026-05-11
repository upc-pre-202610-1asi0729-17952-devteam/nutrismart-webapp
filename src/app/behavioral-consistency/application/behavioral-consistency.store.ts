import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { AdherenceStatus } from '../domain/model/adherence-status.enum';
import {
  BehavioralProgress,
  BehavioralProgressProps,
} from '../domain/model/behavioral-progress.entity';
import { BehavioralConsistencyApi } from '../infrastructure/behavioral-consistency-api';

/**
 * Central state store for the Behavioral Consistency bounded context.
 *
 * Manages the current user's behavioral progress using Angular signals.
 * All mutations are persisted to the backend via {@link BehavioralConsistencyApi}.
 *
 * Provided in root so a single instance is shared across the application.
 */
@Injectable({ providedIn: 'root' })
export class BehavioralConsistencyStore {
  /** API façade for HTTP operations on behavioral progress resources. */
  private behavioralConsistencyApi = inject(BehavioralConsistencyApi);

  /** Current behavioral progress for the active user, or `null` if not loaded. */
  private _currentProgress = signal<BehavioralProgress | null>(null);

  /** Whether an async operation is in flight. */
  private _loading = signal<boolean>(false);

  /** Last error message from a failed async operation, or `null`. */
  private _error = signal<string | null>(null);

  // ─── Public readonly signals ───────────────────────────────────────────────

  /** Read-only signal exposing the current {@link BehavioralProgress}. */
  readonly currentProgress = this._currentProgress.asReadonly();

  /** Read-only signal indicating whether an async operation is in progress. */
  readonly loading = this._loading.asReadonly();

  /** Read-only signal holding the most recent error message, or `null`. */
  readonly error = this._error.asReadonly();

  /** Current behavioral adherence status, or `null` if progress is not loaded. */
  readonly adherenceStatus = computed(() =>
    this._currentProgress()?.adherenceStatus ?? null
  );

  /** Current streak, or 0 if progress is not loaded. */
  readonly streak = computed(() =>
    this._currentProgress()?.streak ?? 0
  );

  /** Current consecutive misses, or 0 if progress is not loaded. */
  readonly consecutiveMisses = computed(() =>
    this._currentProgress()?.consecutiveMisses ?? 0
  );

  /** Weekly completion flags, or an empty array if progress is not loaded. */
  readonly weekDots = computed(() =>
    this._currentProgress()?.weekDots ?? []
  );

  /** Number of completed days in the current weekly view. */
  readonly completedDaysThisWeek = computed(() =>
    this._currentProgress()?.completedDaysThisWeek ?? 0
  );

  /** Weekly completion rate from 0 to 100. */
  readonly weeklyCompletionRate = computed(() =>
    this._currentProgress()?.weeklyCompletionRate ?? 0
  );

  /** Whether the user is currently on track. */
  readonly isOnTrack = computed(() =>
    this._currentProgress()?.isOnTrack() ?? false
  );

  /** Whether the user needs behavioral re-engagement. */
  readonly needsReEngagement = computed(() =>
    this._currentProgress()?.needsReEngagement() ?? false
  );

  /** Compact summary of the current behavioral progress. */
  readonly behavioralSummary = computed(() =>
    this._currentProgress()?.behavioralSummary() ?? 'No behavioral progress loaded'
  );

  // ─── Loading / initialization ──────────────────────────────────────────────

  /**
   * Loads the behavioral progress record for a specific user.
   *
   * @param userId - Numeric identifier of the user.
   * @returns Observable emitting the loaded progress or `undefined` if not found.
   */
  loadByUserId(userId: number): Observable<BehavioralProgress | undefined> {
    this._loading.set(true);
    this._error.set(null);

    return this.behavioralConsistencyApi.getBehavioralProgressByUserId(userId).pipe(
      tap(progress => {
        this._currentProgress.set(progress ?? null);
        this._loading.set(false);
      }),
      catchError(err => {
        this._loading.set(false);
        this._error.set(err.message);
        return throwError(() => err);
      })
    );
  }

  /**
   * Loads the behavioral progress for a user, creating an initial record
   * if no progress exists yet.
   *
   * Useful for newly registered users that do not have `/behavioral-progress`
   * data in the backend.
   *
   * @param userId - Numeric identifier of the user.
   * @returns Observable emitting the existing or newly created progress.
   */
  ensureProgressForUser(userId: number): Observable<BehavioralProgress> {
    this._loading.set(true);
    this._error.set(null);

    return new Observable<BehavioralProgress>(observer => {
      this.behavioralConsistencyApi.getBehavioralProgressByUserId(userId).subscribe({
        next: existing => {
          if (existing) {
            this._currentProgress.set(existing);
            this._loading.set(false);
            observer.next(existing);
            observer.complete();
            return;
          }

          const initialProgress = this.createInitialProgress(userId);

          this.behavioralConsistencyApi.createBehavioralProgress(initialProgress).subscribe({
            next: created => {
              this._currentProgress.set(created);
              this._loading.set(false);
              observer.next(created);
              observer.complete();
            },
            error: err => {
              this._loading.set(false);
              this._error.set(err.message);
              observer.error(err);
            },
          });
        },
        error: err => {
          this._loading.set(false);
          this._error.set(err.message);
          observer.error(err);
        },
      });
    });
  }

  /**
   * Clears the currently loaded behavioral progress from memory.
   *
   * Does not delete anything from the backend.
   */
  clear(): void {
    this._currentProgress.set(null);
    this._error.set(null);
    this._loading.set(false);
  }

  // ─── Behavioral mutations ─────────────────────────────────────────────────

  /**
   * Marks today's behavioral goal as completed and persists the change.
   *
   * @param date - Goal completion date in ISO format. Defaults to today.
   */
  markGoalMet(date: string = this.todayIsoDate()): void {
    const progress = this._currentProgress();
    if (!progress) return;

    progress.markGoalMet(date);
    this._currentProgress.set(progress);
    this.persist();
  }

  /**
   * Marks today's behavioral goal as missed and persists the change.
   */
  markGoalMissed(): void {
    const progress = this._currentProgress();
    if (!progress) return;

    progress.markGoalMissed();
    this._currentProgress.set(progress);
    this.persist();
  }

  /**
   * Replaces the weekly completion dots and recalculates the adherence status.
   *
   * @param weekDots - New weekly completion flags.
   */
  updateWeekDots(weekDots: boolean[]): void {
    const progress = this._currentProgress();
    if (!progress) return;

    progress.weekDots = weekDots;
    progress.recalculateAdherenceStatus();
    this._currentProgress.set(progress);
    this.persist();
  }

  /**
   * Replaces the streak value and recalculates the adherence status.
   *
   * @param streak - New streak value.
   */
  updateStreak(streak: number): void {
    const progress = this._currentProgress();
    if (!progress) return;

    progress.streak = streak;
    progress.recalculateAdherenceStatus();
    this._currentProgress.set(progress);
    this.persist();
  }

  /**
   * Replaces the consecutive misses value and recalculates the adherence status.
   *
   * @param consecutiveMisses - New consecutive misses value.
   */
  updateConsecutiveMisses(consecutiveMisses: number): void {
    const progress = this._currentProgress();
    if (!progress) return;

    progress.consecutiveMisses = consecutiveMisses;
    progress.recalculateAdherenceStatus();
    this._currentProgress.set(progress);
    this.persist();
  }

  /**
   * Manually sets the adherence status and persists the change.
   *
   * Prefer using `markGoalMet`, `markGoalMissed`, or
   * `recalculateAdherenceStatus` when possible.
   *
   * @param status - New adherence status.
   */
  setAdherenceStatus(status: AdherenceStatus): void {
    const progress = this._currentProgress();
    if (!progress) return;

    progress.adherenceStatus = status;
    this._currentProgress.set(progress);
    this.persist();
  }

  /**
   * Loads local preview data without calling the backend.
   *
   * Useful while developing the Behavioral Consistency UI independently
   * from authentication and API availability.
   */
  loadPreviewProgress(): void {
    const previewProgress = new BehavioralProgress({
      id: 1,
      userId: 1,
      adherenceStatus: AdherenceStatus.ON_TRACK,
      streak: 5,
      consecutiveMisses: 0,
      lastGoalMetDate: '2026-05-06',
      weekDots: [true, true, true, true, true, false, false],
    });

    this._currentProgress.set(previewProgress);
    this._loading.set(false);
    this._error.set(null);
  }

  // ─── Private helpers ───────────────────────────────────────────────────────

  /**
   * Persists the current behavioral progress to the API via a full PUT replacement.
   */
  private persist(): void {
    const progress = this._currentProgress();
    if (!progress) return;

    this._loading.set(true);
    this._error.set(null);

    this.behavioralConsistencyApi.updateBehavioralProgress(progress).subscribe({
      next: updated => {
        this._currentProgress.set(updated);
        this._loading.set(false);
      },
      error: err => {
        this._loading.set(false);
        this._error.set(err.message);
      },
    });
  }

  /**
   * Creates a default behavioral progress entity for a new user.
   *
   * @param userId - Numeric identifier of the user.
   * @returns Initial {@link BehavioralProgress} entity.
   */
  private createInitialProgress(userId: number): BehavioralProgress {
    const props: BehavioralProgressProps = {
      id: Date.now(),
      userId,
      adherenceStatus: AdherenceStatus.ON_TRACK,
      streak: 0,
      consecutiveMisses: 0,
      lastGoalMetDate: '',
      weekDots: [false, false, false, false, false, false, false],
    };

    return new BehavioralProgress(props);
  }

  /**
   * Returns today's date in ISO `YYYY-MM-DD` format.
   *
   * @returns Current date string.
   */
  private todayIsoDate(): string {
    return new Date().toISOString().split('T')[0];
  }
}
