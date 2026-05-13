import { BaseEntity } from '../../../shared/infrastructure/base-entity';
import { BehaviorPatternType } from './behavior-pattern-type.enum';
import { BehavioralProgress } from './behavioral-progress.entity';

/** Constructor data for {@link EatingBehaviorPattern}. */
export interface EatingBehaviorPatternProps {
  /** Unique numeric identifier assigned by the backend. */
  id?: number;
  /** Identifier of the user this pattern belongs to. */
  userId: number;
  /**
   * Percentage of days completed in the last 7-day window (0–100).
   * Mirrors {@link BehavioralProgress.weeklyCompletionRate} at analysis time.
   */
  weeklyCompletionRate: number;
  /** Active consecutive-day streak at analysis time. */
  currentStreak: number;
  /** Consecutive misses at analysis time. */
  consecutiveMisses: number;
  /** Classified behavioral pattern for this window. */
  patternType: BehaviorPatternType;
  /** ISO date (YYYY-MM-DD) when this analysis was run. */
  analyzedAt: string;
}

/**
 * Domain entity that captures a point-in-time classification of the user's
 * eating behavior pattern over the trailing 7-day window.
 *
 * Created by {@link EatingBehaviorPattern.fromProgress} — do not instantiate
 * manually from the store; use the factory so classification logic stays in the domain.
 *
 * @example
 * const pattern = EatingBehaviorPattern.fromProgress(userId, progress);
 * pattern.patternType; // BehaviorPatternType.RECOVERING
 * pattern.isImproving(); // true
 */
export class EatingBehaviorPattern implements BaseEntity {
  private _id: number;
  private _userId: number;
  private _weeklyCompletionRate: number;
  private _currentStreak: number;
  private _consecutiveMisses: number;
  private _patternType: BehaviorPatternType;
  private _analyzedAt: string;

  constructor(props: EatingBehaviorPatternProps) {
    this._id                  = props.id ?? 0;
    this._userId              = props.userId;
    this._weeklyCompletionRate = props.weeklyCompletionRate;
    this._currentStreak       = props.currentStreak;
    this._consecutiveMisses   = props.consecutiveMisses;
    this._patternType         = props.patternType;
    this._analyzedAt          = props.analyzedAt;
  }

  // ─── Getters & Setters ────────────────────────────────────────────────────

  get id(): number { return this._id; }
  set id(v: number) { this._id = v; }

  get userId(): number { return this._userId; }
  set userId(v: number) { this._userId = v; }

  /** Percentage of days with a complete log in the last 7 days (0–100). */
  get weeklyCompletionRate(): number { return this._weeklyCompletionRate; }
  set weeklyCompletionRate(v: number) { this._weeklyCompletionRate = v; }

  /** Active streak at the time of analysis. */
  get currentStreak(): number { return this._currentStreak; }
  set currentStreak(v: number) { this._currentStreak = v; }

  /** Consecutive missed days at the time of analysis. */
  get consecutiveMisses(): number { return this._consecutiveMisses; }
  set consecutiveMisses(v: number) { this._consecutiveMisses = v; }

  /** Classified behavioral pattern for this window. */
  get patternType(): BehaviorPatternType { return this._patternType; }
  set patternType(v: BehaviorPatternType) { this._patternType = v; }

  /** ISO date when this analysis was run. */
  get analyzedAt(): string { return this._analyzedAt; }
  set analyzedAt(v: string) { this._analyzedAt = v; }

  // ─── Domain Behaviour ─────────────────────────────────────────────────────

  /**
   * Whether the pattern shows positive momentum (active streak, no misses).
   *
   * @returns `true` when streak > 0 and consecutiveMisses is 0.
   */
  isImproving(): boolean {
    return this._currentStreak > 0 && this._consecutiveMisses === 0;
  }

  /**
   * Whether the pattern is in active decline (2+ consecutive misses).
   *
   * @returns `true` when consecutiveMisses >= 2.
   */
  isDeclining(): boolean {
    return this._consecutiveMisses >= 2;
  }

  /**
   * Whether the pattern suggests the user is consistent enough to maintain progress.
   *
   * @returns `true` for {@link BehaviorPatternType.CONSISTENT}.
   */
  isConsistent(): boolean {
    return this._patternType === BehaviorPatternType.CONSISTENT;
  }

  // ─── Static Factory ───────────────────────────────────────────────────────

  /**
   * Derives an {@link EatingBehaviorPattern} from a {@link BehavioralProgress} entity.
   *
   * Classification rules (based on available data — day-of-week breakdown
   * requires future schema extension):
   * - CONSISTENT   : weeklyCompletionRate ≥ 71 % (≥ 5 out of 7 days)
   * - RECOVERING   : active streak but weeklyCompletionRate < 71 %
   * - IRREGULAR    : no active streak or completion below 50 %
   *
   * @param userId   - User the pattern belongs to.
   * @param progress - Current behavioral progress snapshot.
   * @param now      - Reference date; defaults to today.
   * @returns A new {@link EatingBehaviorPattern} ready to persist.
   */
  static fromProgress(
    userId: number,
    progress: BehavioralProgress,
    now: Date = new Date(),
  ): EatingBehaviorPattern {
    return new EatingBehaviorPattern({
      userId,
      weeklyCompletionRate: progress.weeklyCompletionRate,
      currentStreak:        progress.streak,
      consecutiveMisses:    progress.consecutiveMisses,
      patternType:          EatingBehaviorPattern.classify(
        progress.weeklyCompletionRate,
        progress.streak,
        progress.consecutiveMisses,
      ),
      analyzedAt: now.toISOString().slice(0, 10),
    });
  }

  /**
   * Classifies the pattern from completion rate, streak, and misses.
   *
   * @param weeklyRate - Percentage of days completed in the window (0–100).
   * @param streak     - Current active streak in days.
   * @param misses     - Current consecutive missed days.
   * @returns The matching {@link BehaviorPatternType}.
   */
  private static classify(
    weeklyRate: number,
    streak: number,
    misses: number,
  ): BehaviorPatternType {
    if (weeklyRate >= 71) return BehaviorPatternType.CONSISTENT;
    if (streak > 0 && misses === 0) return BehaviorPatternType.RECOVERING;
    return BehaviorPatternType.IRREGULAR;
  }
}
