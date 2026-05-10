import { BaseEntity } from '../../../shared/infrastructure/base-entity';

/**
 * WHO BMI classification categories.
 *
 * @author Espinoza Cruz, Angela Milagros
 */
export enum BmiCategory {
  UNDERWEIGHT = 'Underweight',
  NORMAL      = 'Normal weight',
  OVERWEIGHT  = 'Overweight',
  OBESE       = 'Obese',
}

/**
 * Constructor DTO for creating a {@link BodyMetric} instance.
 *
 * @author Espinoza Cruz, Angela Milagros
 */
export interface BodyMetricProps {
  /** Unique numeric identifier. */
  id: number;
  /** Owner user ID. */
  userId: number;
  /** Body weight in kilograms. */
  weightKg: number;
  /** Height in centimetres. */
  heightCm: number;
  /** ISO timestamp of when this metric was recorded. */
  loggedAt: string;
  /** Optional explicit target weight in kg. */
  targetWeightKg?: number;
  /** Estimated projected achievement date (ISO string). */
  projectedAchievementDate?: string;
}

/**
 * Domain entity representing a body metric snapshot for a user.
 *
 * Non-anemic: encapsulates BMI calculation, WHO category classification,
 * BMR (Mifflin-St Jeor), TDEE estimation, and staleness detection.
 * The activity multiplier is set to 1.55 (moderately active) by default.
 *
 * @author Espinoza Cruz, Angela Milagros
 */
export class BodyMetric implements BaseEntity {
  #id: number;
  #userId: number;
  #weightKg: number;
  #heightCm: number;
  #loggedAt: string;
  #targetWeightKg: number;
  #projectedAchievementDate: string;

  constructor(props: BodyMetricProps) {
    this.#id                      = props.id;
    this.#userId                   = props.userId;
    this.#weightKg                 = props.weightKg;
    this.#heightCm                 = props.heightCm;
    this.#loggedAt                 = props.loggedAt;
    this.#targetWeightKg           = props.targetWeightKg ?? 0;
    this.#projectedAchievementDate = props.projectedAchievementDate ?? '';
  }

  // ─── Getters & Setters ────────────────────────────────────────────────────

  /** Unique numeric identifier. */
  get id(): number { return this.#id; }
  set id(v: number) { this.#id = v; }

  /** Owner user ID. */
  get userId(): number { return this.#userId; }
  set userId(v: number) { this.#userId = v; }

  /** Body weight in kg. */
  get weightKg(): number { return this.#weightKg; }
  set weightKg(v: number) { this.#weightKg = v; }

  /** Height in cm. */
  get heightCm(): number { return this.#heightCm; }
  set heightCm(v: number) { this.#heightCm = v; }

  /** ISO timestamp of this metric entry. */
  get loggedAt(): string { return this.#loggedAt; }
  set loggedAt(v: string) { this.#loggedAt = v; }

  /** Target weight in kg. */
  get targetWeightKg(): number { return this.#targetWeightKg; }
  set targetWeightKg(v: number) { this.#targetWeightKg = v; }

  /** Projected achievement date ISO string. */
  get projectedAchievementDate(): string { return this.#projectedAchievementDate; }
  set projectedAchievementDate(v: string) { this.#projectedAchievementDate = v; }

  // ─── Domain Behaviour ─────────────────────────────────────────────────────

  /**
   * Calculates Body Mass Index.
   * Formula: weight (kg) / (height (m))^2, rounded to one decimal place.
   */
  bmi(): number {
    const h = this.#heightCm / 100;
    return Math.round((this.#weightKg / (h * h)) * 10) / 10;
  }

  /**
   * Returns the WHO BMI category for the current BMI value.
   */
  bmiCategory(): BmiCategory {
    const b = this.bmi();
    if (b < 18.5) return BmiCategory.UNDERWEIGHT;
    if (b < 25)   return BmiCategory.NORMAL;
    if (b < 30)   return BmiCategory.OVERWEIGHT;
    return BmiCategory.OBESE;
  }

  /**
   * Calculates Basal Metabolic Rate using the Mifflin-St Jeor formula
   * (female variant as used across the app).
   *
   * Formula: (10 × weight) + (6.25 × height) − 161
   * Result rounded to the nearest integer.
   */
  bmr(): number {
    return Math.round(10 * this.#weightKg + 6.25 * this.#heightCm - 161);
  }

  /**
   * Estimates Total Daily Energy Expenditure assuming moderate activity
   * (multiplier 1.55).
   *
   * Result rounded to the nearest integer.
   */
  tdee(): number {
    return Math.round(this.bmr() * 1.55);
  }

  /**
   * Returns `true` when the metric entry is older than `days` days from now.
   *
   * Used to trigger the 14-day staleness banner in the body progress view.
   *
   * @param days - Number of days after which the entry is considered stale.
   * @param now  - Reference date (defaults to `new Date()`).
   */
  isStale(days: number, now: Date = new Date()): boolean {
    const logged = new Date(this.#loggedAt);
    const diffMs = now.getTime() - logged.getTime();
    return diffMs > days * 24 * 60 * 60 * 1000;
  }

  /**
   * Returns a human-readable "Updated X" label for the metric card
   * (e.g. "Updated today", "Updated 3 days ago").
   *
   * @param now - Reference date (defaults to `new Date()`).
   */
  updatedLabel(now: Date = new Date()): string {
    const logged = new Date(this.#loggedAt);
    const days   = Math.floor((now.getTime() - logged.getTime()) / (24 * 60 * 60 * 1000));
    if (days === 0) return 'Updated today';
    if (days === 1) return 'Updated yesterday';
    return `Outdated · ${logged.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  }

  /**
   * Calculates the projected achievement date for a weight goal using a
   * constant weekly-rate model.
   *
   * Formula: days = ceil(|currentWeight − target| / weeklyRate × 7)
   *
   * Default rate (0.25 kg/week) corresponds to a conservative safe deficit/surplus
   * used throughout the app's mockup reference dates.
   *
   * @param targetWeightKg - Goal weight in kilograms.
   * @param weeklyRateKg   - Expected weekly change in kg (default 0.25).
   * @param from           - Anchor date for the projection (defaults to today).
   * @returns Projected {@link Date} on which the goal should be reached.
   */
  calculateProjectedDate(
    targetWeightKg: number,
    weeklyRateKg = 0.25,
    from: Date = new Date(),
  ): Date {
    const diff       = Math.abs(this.#weightKg - targetWeightKg);
    const daysNeeded = diff > 0 ? Math.ceil((diff / weeklyRateKg) * 7) : 0;
    const result     = new Date(from);
    result.setDate(result.getDate() + daysNeeded);
    return result;
  }

  /**
   * Returns `true` when the target weight is a valid weight-loss goal
   * (i.e. strictly less than the current weight).
   */
  isValidWeightLossTarget(target: number): boolean {
    return target > 0 && target < this.#weightKg;
  }
}
