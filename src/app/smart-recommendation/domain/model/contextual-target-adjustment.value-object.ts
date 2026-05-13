/** Origin of a contextual calorie target adjustment. */
export type AdjustmentSource = 'TRAVEL' | 'WEATHER' | 'ACTIVITY_TREND';

/**
 * Immutable value object representing a multiplicative calorie adjustment
 * derived from the user's active context (travel destination or weather).
 *
 * A factor of `1.10` means +10 %; `0.95` means −5 %.
 */
export class ContextualTargetAdjustment {
  /** Multiplicative factor to apply to the base calorie target. */
  readonly factor: number;

  /** Human-readable i18n key describing why this adjustment was made. */
  readonly reason: string;

  /** Context that produced this adjustment. */
  readonly source: AdjustmentSource;

  /**
   * @param factor - Multiplicative factor (e.g. 1.10 = +10 %).
   * @param reason - i18n key for the adjustment reason shown in the UI.
   * @param source - Origin of the adjustment.
   */
  constructor(factor: number, reason: string, source: AdjustmentSource) {
    this.factor = factor;
    this.reason = reason;
    this.source = source;
  }

  /**
   * Applies this adjustment to a base calorie target and rounds to the
   * nearest whole number.
   *
   * @param baseTarget - The calorie target before contextual adjustment.
   * @returns Adjusted calorie target.
   */
  apply(baseTarget: number): number {
    return Math.round(baseTarget * this.factor);
  }

  /** Whether this adjustment actually changes the target (factor ≠ 1). */
  isActive(): boolean {
    return this.factor !== 1;
  }
}
