/** Identifies which macro the warning refers to. */
export type MacroName = 'calories' | 'protein' | 'carbohydrates' | 'fats' | 'fiber';

/** Whether the macro is approaching (80–99%) or has exceeded (≥100%) its daily target. */
export type WarningLevel = 'approaching' | 'exceeded';

/**
 * Immutable value object representing a macro that has crossed a warning threshold.
 *
 * Created by {@link DailyIntake.checkWarnings} and consumed by the application
 * layer to drive UI feedback without any presentation logic in the domain.
 */
export class MacroWarning {
  constructor(
    /** The macro that triggered the warning. */
    readonly macro:   MacroName,
    /** Severity level — approaching (≥80%) or exceeded (≥100%). */
    readonly level:   WarningLevel,
    /** Consumption as a percentage of the daily target (0–∞). */
    readonly percent: number,
  ) {}

  /** @returns `true` when the macro is between 80% and 99% of its target. */
  get isApproaching(): boolean { return this.level === 'approaching'; }

  /** @returns `true` when the macro has reached or surpassed its target. */
  get isExceeded(): boolean { return this.level === 'exceeded'; }
}
