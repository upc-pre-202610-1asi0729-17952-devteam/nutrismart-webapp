import { BaseEntity } from '../../../shared/infrastructure/base-entity';
import { UserGoal } from '../../../iam/domain/model/user-goal.enum';

/**
 * Constructor DTO for creating a {@link RecipeSuggestion} instance.
 *
 * @author Del Aguila Del Aguila, Olenka Priscilla
 */
export interface RecipeSuggestionProps {
  id: number;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredients: string[];
  goalType: UserGoal;
  prepTimeMinutes: number;
  coversMacroPct: number;
}

/**
 * Domain entity representing a recipe suggested based on the user's pantry.
 *
 * Non-anemic: exposes {@link goalBadgeLabel}, {@link goalBadgeColor}, and
 * {@link macroSummary} so the presentation layer stays free of formatting logic.
 *
 * @author Del Aguila Del Aguila, Olenka Priscilla
 */
export class RecipeSuggestion implements BaseEntity {
  private _id: number;
  private _name: string;
  private _calories: number;
  private _protein: number;
  private _carbs: number;
  private _fat: number;
  private _ingredients: string[];
  private _goalType: UserGoal;
  private _prepTimeMinutes: number;
  /** Percentage of the user's most-deficient macro this recipe covers. */
  private _coversMacroPct: number;

  constructor(props: RecipeSuggestionProps) {
    this._id              = props.id;
    this._name            = props.name;
    this._calories        = props.calories;
    this._protein         = props.protein;
    this._carbs           = props.carbs;
    this._fat             = props.fat;
    this._ingredients     = [...props.ingredients];
    this._goalType        = props.goalType;
    this._prepTimeMinutes = props.prepTimeMinutes;
    this._coversMacroPct  = props.coversMacroPct;
  }

  // ─── Getters & Setters ────────────────────────────────────────────────────

  get id(): number { return this._id; }
  set id(v: number) { this._id = v; }

  get name(): string { return this._name; }
  set name(v: string) { this._name = v; }

  get calories(): number { return this._calories; }
  set calories(v: number) { this._calories = v; }

  get protein(): number { return this._protein; }
  set protein(v: number) { this._protein = v; }

  get carbs(): number { return this._carbs; }
  set carbs(v: number) { this._carbs = v; }

  get fat(): number { return this._fat; }
  set fat(v: number) { this._fat = v; }

  get ingredients(): string[] { return [...this._ingredients]; }
  set ingredients(v: string[]) { this._ingredients = [...v]; }

  get goalType(): UserGoal { return this._goalType; }
  set goalType(v: UserGoal) { this._goalType = v; }

  get prepTimeMinutes(): number { return this._prepTimeMinutes; }
  set prepTimeMinutes(v: number) { this._prepTimeMinutes = v; }

  get coversMacroPct(): number { return this._coversMacroPct; }
  set coversMacroPct(v: number) { this._coversMacroPct = v; }

  // ─── Domain Behaviour ─────────────────────────────────────────────────────

  /**
   * Human-readable label for the goal badge displayed on the recipe card.
   *
   * @returns "Weight-loss" or "Muscle-gain"
   */
  get goalBadgeLabel(): string {
    return this._goalType === UserGoal.WEIGHT_LOSS ? 'Weight-loss' : 'Muscle-gain';
  }

  /**
   * CSS colour token associated with the goal badge.
   *
   * @returns Hex colour string.
   */
  get goalBadgeColor(): string {
    return this._goalType === UserGoal.WEIGHT_LOSS ? '#16a34a' : '#2563eb';
  }

  /**
   * Compact macro summary for display in the recipe card.
   *
   * @returns e.g. "P 18g · G 8g"
   */
  get macroSummary(): string {
    return `P ${this._protein}g · G ${this._fat}g`;
  }

  /**
   * Comma-separated list of ingredient names for display.
   */
  get ingredientList(): string {
    return this._ingredients.join(', ');
  }

  /**
   * Whether this recipe is well-suited for the user's current goal.
   *
   * A recipe is considered goal-aligned when it covers at least 20 % of the
   * most-deficient macro for that goal type.
   *
   * @returns `true` when the recipe is goal-aligned.
   */
  isGoalAligned(): boolean {
    return this._coversMacroPct >= 20;
  }
}
