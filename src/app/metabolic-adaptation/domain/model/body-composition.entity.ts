import { BaseEntity } from '../../../shared/infrastructure/base-entity';

/**
 * Constructor DTO for creating a {@link BodyComposition} instance.
 *
 * @author Espinoza Cruz, Angela Milagros
 */
export interface BodyCompositionProps {
  /** Unique numeric identifier. */
  id: number;
  /** Owner user ID. */
  userId: number;
  /** Waist circumference in centimetres. */
  waistCm: number;
  /** Neck circumference in centimetres. Defaults to 36 cm when omitted. */
  neckCm?: number;
  /** Height in centimetres (needed for the US Navy body fat formula). */
  heightCm: number;
  /** Weight in kilograms (needed for lean/fat mass calculation). */
  weightKg: number;
  /** ISO timestamp of the measurement. */
  measuredAt: string;
  /** Body fat percentage from the previous measurement period (for delta check). */
  previousBodyFatPercent?: number;
  /**
   * Direct body fat percentage override (from pant-size or visual-range estimation).
   * When present, bypasses the US Navy formula entirely.
   */
  overrideBodyFatPercent?: number;
}

/**
 * Domain entity representing a body composition measurement.
 *
 * Non-anemic: encapsulates the US Navy body-fat estimation formula,
 * lean/fat mass derivation, and the alert logic for excessive fat gain
 * (>1.5% increase over the last two weeks).
 *
 * @author Espinoza Cruz, Angela Milagros
 */
const DEFAULT_NECK_CM             = 36;
const FAT_ALERT_THRESHOLD_PERCENT = 1.5;

export class BodyComposition implements BaseEntity {
  #id: number;
  #userId: number;
  #waistCm: number;
  #neckCm: number;
  #heightCm: number;
  #weightKg: number;
  #measuredAt: string;
  #previousBodyFatPercent: number;
  #overrideBodyFatPercent: number | undefined;

  constructor(props: BodyCompositionProps) {
    this.#id                     = props.id;
    this.#userId                 = props.userId;
    this.#waistCm                = props.waistCm;
    this.#neckCm                 = props.neckCm ?? DEFAULT_NECK_CM;
    this.#heightCm               = props.heightCm;
    this.#weightKg               = props.weightKg;
    this.#measuredAt             = props.measuredAt;
    this.#previousBodyFatPercent = props.previousBodyFatPercent ?? 0;
    this.#overrideBodyFatPercent = props.overrideBodyFatPercent;
  }

  // ─── Getters & Setters ────────────────────────────────────────────────────

  /** Unique numeric identifier. */
  get id(): number { return this.#id; }
  set id(v: number) { this.#id = v; }

  /** Owner user ID. */
  get userId(): number { return this.#userId; }
  set userId(v: number) { this.#userId = v; }

  /** Waist circumference in cm. */
  get waistCm(): number { return this.#waistCm; }
  set waistCm(v: number) { this.#waistCm = v; }

  /** Neck circumference in cm (defaults to 36 when not measured). */
  get neckCm(): number { return this.#neckCm; }
  set neckCm(v: number) { this.#neckCm = v; }

  /** Direct body fat % override; bypasses US Navy formula when set. */
  get overrideBodyFatPercent(): number | undefined { return this.#overrideBodyFatPercent; }
  set overrideBodyFatPercent(v: number | undefined) { this.#overrideBodyFatPercent = v; }

  /** Height in cm. */
  get heightCm(): number { return this.#heightCm; }
  set heightCm(v: number) { this.#heightCm = v; }

  /** Weight in kg. */
  get weightKg(): number { return this.#weightKg; }
  set weightKg(v: number) { this.#weightKg = v; }

  /** ISO timestamp of measurement. */
  get measuredAt(): string { return this.#measuredAt; }
  set measuredAt(v: string) { this.#measuredAt = v; }

  /** Previous body fat % for delta alert calculation. */
  get previousBodyFatPercent(): number { return this.#previousBodyFatPercent; }
  set previousBodyFatPercent(v: number) { this.#previousBodyFatPercent = v; }

  // ─── Domain Behaviour ─────────────────────────────────────────────────────

  /**
   * Calculates body fat percentage using the US Navy circumference method
   * (male formula: 86.010 × log10(abdomen − neck) − 70.041 × log10(height) + 36.76).
   *
   * A simplified female formula is used as fallback; this method uses the male
   * variant as the reference throughout the application.
   *
   * Result rounded to one decimal place.
   */
  bodyFatPercent(): number {
    if (this.#overrideBodyFatPercent !== undefined) return this.#overrideBodyFatPercent;
    const abdomen = this.#waistCm;
    const neck    = this.#neckCm;
    const height  = this.#heightCm;
    if (abdomen <= neck || height <= 0) return 0;
    const bf = 86.010 * Math.log10(abdomen - neck) - 70.041 * Math.log10(height) + 36.76;
    return Math.round(Math.max(bf, 0) * 10) / 10;
  }

  /**
   * Calculates fat mass in kilograms from current weight and body fat %.
   *
   * Result rounded to one decimal place.
   */
  fatMassKg(): number {
    return Math.round((this.#weightKg * (this.bodyFatPercent() / 100)) * 10) / 10;
  }

  /**
   * Calculates lean mass in kilograms (weight − fat mass).
   *
   * Result rounded to one decimal place.
   */
  leanMassKg(): number {
    return Math.round((this.#weightKg - this.fatMassKg()) * 10) / 10;
  }

  /**
   * Returns `true` when body fat has increased by more than 1.5 percentage
   * points compared to the previous measurement — indicating excessive fat
   * gain during a muscle-gain bulk phase.
   *
   * This triggers the red Angular Material Banner warning in the view.
   */
  hasFatIncreaseAlert(): boolean {
    if (this.#previousBodyFatPercent === 0) return false;
    return this.bodyFatPercent() - this.#previousBodyFatPercent > FAT_ALERT_THRESHOLD_PERCENT;
  }

}
