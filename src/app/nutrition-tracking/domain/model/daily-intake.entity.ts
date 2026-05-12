import { BaseEntity } from '../../../shared/infrastructure/base-entity';
import { MacronutrientDistribution } from './macronutrient-distribution.value-object';
import { MacroThreshold } from './macro-threshold';
import { MacroWarning, MacroName } from './macro-warning.value-object';

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
   * Updates the daily calorie goal, e.g. when a new metabolic target arrives.
   *
   * @param newGoal - New daily calorie target in kcal.
   */
  updateGoal(newGoal: number): void {
    this._dailyGoal = newGoal;
  }

  /**
   * Updates the active (exercise) calorie adjustment for the day.
   *
   * @param calories - Total active calories burned today.
   */
  updateActive(calories: number): void {
    this._active = calories;
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

  /**
   * Evaluates all macros against their daily targets and returns any that have
   * crossed the {@link MacroThreshold.APPROACHING} (80%) or {@link MacroThreshold.EXCEEDED} (100%) boundary.
   *
   * Calories are checked against the entity's own `dailyGoal`; all other macros
   * use the provided `targets` map.
   *
   * @param consumed - Snapshot of nutrients consumed so far today.
   * @param targets  - User's macro targets in grams (protein, carbs, fat, fiber).
   * @returns Ordered list of {@link MacroWarning} value objects, one per affected macro.
   */
  checkWarnings(
    consumed: { calories: number; protein: number; carbs: number; fat: number; fiber: number },
    targets: { protein: number; carbs: number; fat: number; fiber: number },
  ): MacroWarning[] {
    const checks: Array<{ macro: MacroName; value: number; target: number }> = [
      { macro: 'calories',      value: consumed.calories, target: this._dailyGoal },
      { macro: 'protein',       value: consumed.protein,  target: targets.protein },
      { macro: 'carbohydrates', value: consumed.carbs,    target: targets.carbs },
      { macro: 'fats',          value: consumed.fat,      target: targets.fat },
      { macro: 'fiber',         value: consumed.fiber,    target: targets.fiber },
    ];

    return checks
      .filter(c => c.target > 0)
      .flatMap(c => {
        const ratio = c.value / c.target;
        if (ratio >= MacroThreshold.EXCEEDED)    return [new MacroWarning(c.macro, 'exceeded',    ratio * 100)];
        if (ratio >= MacroThreshold.APPROACHING) return [new MacroWarning(c.macro, 'approaching', ratio * 100)];
        return [];
      });
  }

  /**
   * Validates whether the consumed macros stay within the user's daily targets.
   *
   * Each key is `true` when the consumed value is within the target (not exceeded).
   *
   * @param consumed - Actual macros consumed for the day.
   * @param targets  - User's macro targets (protein, carbs, fat, fiber in grams).
   */
  validateMacronutrients(
    consumed: MacronutrientDistribution,
    targets: { protein: number; carbs: number; fat: number; fiber: number },
  ): { calories: boolean; protein: boolean; carbs: boolean; fat: boolean; fiber: boolean } {
    return {
      calories: consumed.calories <= this._dailyGoal,
      protein:  consumed.protein  <= targets.protein,
      carbs:    consumed.carbs    <= targets.carbs,
      fat:      consumed.fat      <= targets.fat,
      fiber:    consumed.fiber    <= targets.fiber,
    };
  }
}
