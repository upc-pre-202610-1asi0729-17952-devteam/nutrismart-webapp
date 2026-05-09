import { BaseEntity } from '../../../shared/infrastructure/base-entity';

/**
 * Constructor DTO for creating a {@link DailyIntake} instance.
 *
 * @author Mora Rivera, Joel Fernando
 */
export interface DailyIntakeProps {
  /** Unique numeric identifier assigned by the backend. */
  id: number;
  /** User identifier this balance belongs to. */
  userId: number;
  /** ISO date string (YYYY-MM-DD) this record represents. */
  date: string;
  /** User's daily calorie goal in kcal. */
  dailyGoal: number;
  /** Total kilocalories consumed from meal records. */
  consumed: number;
  /** Active calories burned (e.g. from Google Fit). */
  active: number;
}

/**
 * Domain entity representing the caloric balance and daily intake for one day.
 *
 * Non-anemic: exposes computed domain properties ({@link remaining},
 * {@link exceeded}, {@link percentConsumed}, {@link netCalories}) that
 * encode the business rules for caloric balance calculations.
 *
 * @author Mora Rivera, Joel Fernando
 */
export class DailyIntake implements BaseEntity {
  private _id: number;
  private _userId: number;
  private _date: string;
  private _dailyGoal: number;
  private _consumed: number;
  private _active: number;

  constructor(props: DailyIntakeProps) {
    this._id        = props.id;
    this._userId    = props.userId;
    this._date      = props.date;
    this._dailyGoal = props.dailyGoal;
    this._consumed  = props.consumed;
    this._active    = props.active;
  }

  // ─── Getters & Setters ────────────────────────────────────────────────────

  get id(): number { return this._id; }
  set id(v: number) { this._id = v; }

  get userId(): number { return this._userId; }
  set userId(v: number) { this._userId = v; }

  get date(): string { return this._date; }
  set date(v: string) { this._date = v; }

  get dailyGoal(): number { return this._dailyGoal; }
  set dailyGoal(v: number) { this._dailyGoal = v; }

  get consumed(): number { return this._consumed; }
  set consumed(v: number) { this._consumed = v; }

  get active(): number { return this._active; }
  set active(v: number) { this._active = v; }

  // ─── Domain Behaviour ─────────────────────────────────────────────────────

  /**
   * Net available calories accounting for goal and active burn.
   *
   * Formula: dailyGoal + active − consumed
   *
   * @returns Remaining kilocalories (negative when exceeded).
   */
  get remaining(): number {
    return this._dailyGoal + this._active - this._consumed;
  }

  /**
   * Whether the user has exceeded their daily caloric target.
   *
   * @returns `true` when {@link remaining} is negative.
   */
  get exceeded(): boolean {
    return this.remaining < 0;
  }

  /**
   * Percentage of the adjusted daily goal consumed so far.
   *
   * Capped at 100 for UI progress bars.
   *
   * @returns Integer from 0 to 100.
   */
  get percentConsumed(): number {
    const net = this._dailyGoal + this._active;
    return net > 0 ? Math.min(Math.round((this._consumed / net) * 100), 100) : 0;
  }

  /**
   * Absolute kilocalories over or under the adjusted goal.
   *
   * @returns Absolute value of {@link remaining}.
   */
  get netCalories(): number {
    return Math.abs(this.remaining);
  }

  /**
   * Human-readable balance summary.
   *
   * @returns e.g. "74% of your goal consumed" or "Exceeded by 220 kcal".
   */
  get balanceSummary(): string {
    return this.exceeded
      ? `Exceeded by ${this.netCalories} kcal`
      : `${this.percentConsumed}% of your goal consumed`;
  }
}
