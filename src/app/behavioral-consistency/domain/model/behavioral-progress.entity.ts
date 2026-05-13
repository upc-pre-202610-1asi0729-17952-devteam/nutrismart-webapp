import { BaseEntity } from '../../../shared/infrastructure/base-entity';
import { AdherenceStatus } from './adherence-status.enum';

/**
 * Constructor data transfer object for creating a {@link BehavioralProgress} instance.
 */
export interface BehavioralProgressProps {
  /** Unique numeric identifier assigned by the backend. */
  id?: number;
  /** Identifier of the user this behavioral progress belongs to. */
  userId: number;
  /** Current adherence status derived from streaks and missed days. */
  adherenceStatus: AdherenceStatus;
  /** Number of consecutive days where the user met the expected behavior. */
  streak: number;
  /** Number of consecutive days where the user missed the expected behavior. */
  consecutiveMisses: number;
  /** Last date where the user met the daily goal, in ISO format. */
  lastGoalMetDate?: string | null;
  /** ISO dates (YYYY-MM-DD) on which the daily goal was completed. */
  goalMetDates?: string[];
}

/**
 * Domain entity representing the user's behavioral consistency progress.
 *
 * Encapsulates business rules related to habit streaks, missed days,
 * adherence status, and weekly goal completion.
 */
export class BehavioralProgress implements BaseEntity {
  /** @see BehavioralProgressProps.id */
  private _id: number;
  /** @see BehavioralProgressProps.userId */
  private _userId: number;
  /** @see BehavioralProgressProps.adherenceStatus */
  private _adherenceStatus: AdherenceStatus;
  /** @see BehavioralProgressProps.streak */
  private _streak: number;
  /** @see BehavioralProgressProps.consecutiveMisses */
  private _consecutiveMisses: number;
  /** @see BehavioralProgressProps.lastGoalMetDate */
  private _lastGoalMetDate: string;
  /** @see BehavioralProgressProps.goalMetDates */
  private _goalMetDates: string[];

  constructor(props: BehavioralProgressProps) {
    this._id                = props.id ?? 0;
    this._userId            = props.userId;
    this._adherenceStatus   = props.adherenceStatus;
    this._streak            = props.streak;
    this._consecutiveMisses = props.consecutiveMisses;
    this._lastGoalMetDate   = props.lastGoalMetDate ?? '';
    this._goalMetDates      = [...(props.goalMetDates ?? [])];
  }

  // ─── Getters & Setters ────────────────────────────────────────────────────

  get id(): number { return this._id; }
  set id(value: number) { this._id = value; }

  get userId(): number { return this._userId; }
  set userId(value: number) { this._userId = value; }

  get adherenceStatus(): AdherenceStatus { return this._adherenceStatus; }
  set adherenceStatus(value: AdherenceStatus) { this._adherenceStatus = value; }

  get streak(): number { return this._streak; }
  set streak(value: number) { this._streak = Math.max(0, value); }

  get consecutiveMisses(): number { return this._consecutiveMisses; }
  set consecutiveMisses(value: number) { this._consecutiveMisses = Math.max(0, value); }

  get lastGoalMetDate(): string { return this._lastGoalMetDate; }
  set lastGoalMetDate(value: string) { this._lastGoalMetDate = value; }

  /** Sorted copy of all ISO dates where the daily goal was completed. */
  get goalMetDates(): string[] { return [...this._goalMetDates]; }
  set goalMetDates(value: string[]) { this._goalMetDates = [...value]; }

  // ─── Computed / Behaviour Methods ─────────────────────────────────────────

  /**
   * Seven booleans representing Monday–Sunday of the current calendar week.
   *
   * Derived from {@link goalMetDates} so it never gets out of sync with
   * the persisted history.
   *
   * @returns Array of 7 booleans, index 0 = Monday, index 6 = Sunday.
   */
  get weekDots(): boolean[] {
    const today      = new Date();
    const dayOfWeek  = (today.getUTCDay() + 6) % 7; // Mon = 0 … Sun = 6
    const monday     = new Date(Date.UTC(
      today.getUTCFullYear(),
      today.getUTCMonth(),
      today.getUTCDate() - dayOfWeek,
    ));

    return Array.from({ length: 7 }, (_, i) => {
      const d       = new Date(monday);
      d.setUTCDate(monday.getUTCDate() + i);
      const dateStr = d.toISOString().slice(0, 10);
      return this._goalMetDates.includes(dateStr);
    });
  }

  /**
   * Number of completed days in the current weekly view.
   *
   * @returns Count of `true` values in {@link weekDots}.
   */
  get completedDaysThisWeek(): number {
    return this.weekDots.filter(Boolean).length;
  }

  /**
   * Weekly completion percentage based on the current week dots.
   *
   * @returns Percentage from 0 to 100.
   */
  get weeklyCompletionRate(): number {
    return Math.round((this.completedDaysThisWeek / 7) * 100);
  }

  /**
   * Determines whether the user is currently on track.
   *
   * @returns `true` when adherence status is ON_TRACK.
   */
  isOnTrack(): boolean {
    return this._adherenceStatus === AdherenceStatus.ON_TRACK;
  }

  /**
   * Determines whether the user needs behavioral re-engagement.
   *
   * @returns `true` when the user is at risk or off track.
   */
  needsReEngagement(): boolean {
    return this._adherenceStatus === AdherenceStatus.AT_RISK ||
      this._adherenceStatus === AdherenceStatus.DROPPED;
  }

  /**
   * Whether the dashboard should display an alert banner for this status.
   *
   * @returns `true` for any status other than ON_TRACK.
   */
  hasAlert(): boolean {
    return this._adherenceStatus !== AdherenceStatus.ON_TRACK;
  }

  /**
   * Next streak milestone expressed as a multiple of 7 days.
   *
   * @returns The next 7-day boundary above the current streak.
   */
  get nextStreakMilestone(): number {
    return Math.ceil((this._streak + 1) / 7) * 7;
  }

  /**
   * Marks today's behavioral goal as completed.
   *
   * No-ops if `date` is already recorded in {@link goalMetDates}.
   *
   * @param date - Goal completion date in ISO format (YYYY-MM-DD).
   */
  markGoalMet(date: string): void {
    if (this._goalMetDates.includes(date)) return;

    this._goalMetDates      = [...this._goalMetDates, date];
    this._streak           += 1;
    this._consecutiveMisses = 0;
    this._lastGoalMetDate   = date;
    this.recalculateAdherenceStatus();
  }

  /**
   * Marks today's behavioral goal as missed.
   *
   * Resets the streak, increases consecutive misses, and recalculates
   * the adherence status. No mutation of {@link goalMetDates} is needed
   * since absences are implicit.
   */
  markGoalMissed(): void {
    this._streak            = 0;
    this._consecutiveMisses += 1;
    this.recalculateAdherenceStatus();
  }

  /**
   * Recalculates adherence status from the current streak and missed days.
   *
   * Rules:
   * - DROPPED: 7 or more consecutive misses.
   * - AT_RISK: 1–6 consecutive misses.
   * - ON_TRACK: no consecutive misses.
   */
  recalculateAdherenceStatus(): void {
    if (this._consecutiveMisses >= 7) {
      this._adherenceStatus = AdherenceStatus.DROPPED;
      return;
    }

    if (this._consecutiveMisses > 0) {
      this._adherenceStatus = AdherenceStatus.AT_RISK;
      return;
    }

    this._adherenceStatus = AdherenceStatus.ON_TRACK;
  }

  /**
   * Returns a compact behavioral summary.
   *
   * @returns A formatted string with streak, misses, and weekly completion.
   */
  behavioralSummary(): string {
    return `${this._streak} day streak | ${this._consecutiveMisses} misses | ${this.weeklyCompletionRate}% weekly completion`;
  }
}
