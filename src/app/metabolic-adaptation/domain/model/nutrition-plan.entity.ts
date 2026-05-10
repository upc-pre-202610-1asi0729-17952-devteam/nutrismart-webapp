import { BaseEntity } from '../../../shared/infrastructure/base-entity';

/**
 * Constructor DTO for creating a {@link NutritionPlan} instance.
 *
 * @author Espinoza Cruz, Angela Milagros
 */
export interface NutritionPlanProps {
  /** Unique numeric identifier. */
  id: number;
  /** Owner user ID. */
  userId: number;
  /** Daily calorie target in kcal. */
  dailyCalorieTarget: number;
  /** Daily protein target in grams. */
  proteinTargetG: number;
  /** Daily carbohydrate target in grams. */
  carbsTargetG: number;
  /** Daily fat target in grams. */
  fatTargetG: number;
  /** Daily fibre target in grams. */
  fiberTargetG: number;
  /** Whether this plan is currently active. */
  isActive: boolean;
  /** ISO date when the plan was created. */
  createdAt: string;
}

/**
 * Domain entity representing a user's active nutrition plan.
 *
 * Non-anemic: exposes domain behaviour methods for macro distribution
 * validation and plan summary generation, preventing these rules from
 * leaking into the presentation layer.
 *
 * @author Espinoza Cruz, Angela Milagros
 */
export class NutritionPlan implements BaseEntity {
  #id: number;
  #userId: number;
  #dailyCalorieTarget: number;
  #proteinTargetG: number;
  #carbsTargetG: number;
  #fatTargetG: number;
  #fiberTargetG: number;
  #isActive: boolean;
  #createdAt: string;

  constructor(props: NutritionPlanProps) {
    this.#id                 = props.id;
    this.#userId             = props.userId;
    this.#dailyCalorieTarget = props.dailyCalorieTarget;
    this.#proteinTargetG     = props.proteinTargetG;
    this.#carbsTargetG       = props.carbsTargetG;
    this.#fatTargetG         = props.fatTargetG;
    this.#fiberTargetG       = props.fiberTargetG;
    this.#isActive           = props.isActive;
    this.#createdAt          = props.createdAt;
  }

  // ─── Getters & Setters ────────────────────────────────────────────────────

  /** Unique numeric identifier. */
  get id(): number { return this.#id; }
  set id(v: number) { this.#id = v; }

  /** Owner user ID. */
  get userId(): number { return this.#userId; }
  set userId(v: number) { this.#userId = v; }

  /** Daily calorie target in kcal. */
  get dailyCalorieTarget(): number { return this.#dailyCalorieTarget; }
  set dailyCalorieTarget(v: number) { this.#dailyCalorieTarget = v; }

  /** Daily protein target in grams. */
  get proteinTargetG(): number { return this.#proteinTargetG; }
  set proteinTargetG(v: number) { this.#proteinTargetG = v; }

  /** Daily carbohydrate target in grams. */
  get carbsTargetG(): number { return this.#carbsTargetG; }
  set carbsTargetG(v: number) { this.#carbsTargetG = v; }

  /** Daily fat target in grams. */
  get fatTargetG(): number { return this.#fatTargetG; }
  set fatTargetG(v: number) { this.#fatTargetG = v; }

  /** Daily fibre target in grams. */
  get fiberTargetG(): number { return this.#fiberTargetG; }
  set fiberTargetG(v: number) { this.#fiberTargetG = v; }

  /** Whether this plan is currently active. */
  get isActive(): boolean { return this.#isActive; }
  set isActive(v: boolean) { this.#isActive = v; }

  /** Plan creation date ISO string. */
  get createdAt(): string { return this.#createdAt; }
  set createdAt(v: string) { this.#createdAt = v; }

  // ─── Domain Behaviour ─────────────────────────────────────────────────────

  /**
   * Calculates protein's share of total daily calories.
   *
   * @returns Percentage as an integer (0–100).
   */
  proteinCaloriePercent(): number {
    return Math.round(((this.#proteinTargetG * 4) / this.#dailyCalorieTarget) * 100);
  }

  /**
   * Calculates carbohydrate's share of total daily calories.
   *
   * @returns Percentage as an integer (0–100).
   */
  carbsCaloriePercent(): number {
    return Math.round(((this.#carbsTargetG * 4) / this.#dailyCalorieTarget) * 100);
  }

  /**
   * Calculates fat's share of total daily calories.
   *
   * @returns Percentage as an integer (0–100).
   */
  fatCaloriePercent(): number {
    return Math.round(((this.#fatTargetG * 9) / this.#dailyCalorieTarget) * 100);
  }

  /**
   * Returns `true` when macro calorie contributions sum to within 5% of
   * the total daily calorie target, indicating a balanced plan.
   */
  isMacroBalanced(): boolean {
    const macroKcal = this.#proteinTargetG * 4 + this.#carbsTargetG * 4 + this.#fatTargetG * 9;
    return Math.abs(macroKcal - this.#dailyCalorieTarget) / this.#dailyCalorieTarget < 0.05;
  }

  /**
   * Returns a compact one-line summary of the plan targets.
   *
   * @returns e.g. "1800 kcal | P:112g C:195g F:50g Fiber:25g"
   */
  summary(): string {
    return `${this.#dailyCalorieTarget} kcal | P:${this.#proteinTargetG}g C:${this.#carbsTargetG}g F:${this.#fatTargetG}g Fiber:${this.#fiberTargetG}g`;
  }
}
