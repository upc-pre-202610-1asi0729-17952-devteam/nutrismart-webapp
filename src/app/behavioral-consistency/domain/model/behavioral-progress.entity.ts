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
  /** Weekly completion flags, usually representing the last seven days. */
  weekDots: boolean[];
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
  /** @see BehavioralProgressProps.weekDots */
  private _weekDots: boolean[];

  /**
   * Creates a new BehavioralProgress domain entity.
   *
   * @param props - All data required to initialise the entity.
   */
  constructor(props: BehavioralProgressProps) {
    this._id = props.id ?? 0;
    this._userId = props.userId;
    this._adherenceStatus = props.adherenceStatus;
    this._streak = props.streak;
    this._consecutiveMisses = props.consecutiveMisses;
    this._lastGoalMetDate = props.lastGoalMetDate ?? '';
    this._weekDots = [...props.weekDots];
  }

  // ─── Getters & Setters ────────────────────────────────────────────────────

  /** Unique numeric identifier assigned by the backend. */
  get id(): number { return this._id; }
  /** @param value - New identifier value. */
  set id(value: number) { this._id = value; }

  /** Identifier of the user this behavioral progress belongs to. */
  get userId(): number { return this._userId; }
  /** @param value - New user identifier value. */
  set userId(value: number) { this._userId = value; }

  /** Current behavioral adherence status. */
  get adherenceStatus(): AdherenceStatus { return this._adherenceStatus; }
  /** @param value - New adherence status. */
  set adherenceStatus(value: AdherenceStatus) { this._adherenceStatus = value; }

  /** Number of consecutive days where the user met the expected behavior. */
  get streak(): number { return this._streak; }
  /** @param value - New streak value. */
  set streak(value: number) { this._streak = Math.max(0, value); }

  /** Number of consecutive missed days. */
  get consecutiveMisses(): number { return this._consecutiveMisses; }
  /** @param value - New consecutive misses value. */
  set consecutiveMisses(value: number) { this._consecutiveMisses = Math.max(0, value); }

  /** Last date where the user met the daily goal, in ISO format. */
  get lastGoalMetDate(): string { return this._lastGoalMetDate; }
  /** @param value - New last goal met date. */
  set lastGoalMetDate(value: string) { this._lastGoalMetDate = value; }

  /** Weekly completion flags. Returns a copy of the internal array. */
  get weekDots(): boolean[] { return [...this._weekDots]; }
  /** @param value - Replacement weekly completion flags. */
  set weekDots(value: boolean[]) { this._weekDots = [...value]; }

  // ─── Computed / Behaviour Methods ─────────────────────────────────────────

  /**
   * Number of completed days in the current weekly view.
   *
   * @returns Count of `true` values in weekDots.
   */
  get completedDaysThisWeek(): number {
    return this._weekDots.filter(Boolean).length;
  }

  /**
   * Weekly completion percentage based on the current weekDots array.
   *
   * @returns Percentage from 0 to 100.
   */
  get weeklyCompletionRate(): number {
    if (this._weekDots.length === 0) {
      return 0;
    }

    return Math.round((this.completedDaysThisWeek / this._weekDots.length) * 100);
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
   * Increases the streak, resets missed days, updates the last goal date,
   * and recalculates the adherence status.
   *
   * @param date - Goal completion date in ISO format.
   */
  markGoalMet(date: string): void {
    this._streak += 1;
    this._consecutiveMisses = 0;
    this._lastGoalMetDate = date;
    this.pushWeekDot(true);
    this.recalculateAdherenceStatus();
  }

  /**
   * Marks today's behavioral goal as missed.
   *
   * Resets the streak, increases consecutive misses, updates the weekly view,
   * and recalculates the adherence status.
   */
  markGoalMissed(): void {
    this._streak = 0;
    this._consecutiveMisses += 1;
    this.pushWeekDot(false);
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

    if (this._consecutiveMisses >= 3) {
      this._adherenceStatus = AdherenceStatus.AT_RISK;
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

  /**
   * Adds a new weekly completion value, keeping only the latest seven entries.
   *
   * @param completed - Whether the goal was completed.
   */
  private pushWeekDot(completed: boolean): void {
    this._weekDots = [...this._weekDots, completed].slice(-7);
  }
}
