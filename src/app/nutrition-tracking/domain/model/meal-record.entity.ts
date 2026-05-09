import { BaseEntity } from '../../../shared/infrastructure/base-entity';
import { MealType } from './meal-type.enum';

/**
 * Constructor DTO for creating a {@link MealRecord} instance.
 *
 * @author Mora Rivera, Joel Fernando
 */
export interface MealRecordProps {
  /** Unique numeric identifier assigned by the backend. */
  id: number;
  /** Identifier of the {@link FoodItem} that was logged. */
  foodItemId: number;
  /** Display name of the food item (denormalised for quick rendering). */
  foodItemName: string;
  /** Meal window this record belongs to. */
  mealType: MealType;
  /** Quantity consumed in {@link unit}. */
  quantity: number;
  /** Unit of the consumed quantity: "g", "ml", or "unit". */
  unit: string;
  /** Kilocalories for the logged quantity. */
  calories: number;
  /** Protein grams for the logged quantity. */
  protein: number;
  /** Carbohydrate grams for the logged quantity. */
  carbs: number;
  /** Fat grams for the logged quantity. */
  fat: number;
  /** Dietary fibre grams for the logged quantity. */
  fiber: number;
  /** Sugar grams for the logged quantity. */
  sugar: number;
  /** ISO timestamp when this entry was logged. */
  loggedAt: string;
  /** User identifier this record belongs to. */
  userId: number;
}

/**
 * Domain entity representing a single meal log entry.
 *
 * Non-anemic: exposes computed properties ({@link macroSummary},
 * {@link isFromToday}) as domain behaviour alongside its data.
 *
 * @author Mora Rivera, Joel Fernando
 */
export class MealRecord implements BaseEntity {
  private _id: number;
  private _foodItemId: number;
  private _foodItemName: string;
  private _mealType: MealType;
  private _quantity: number;
  private _unit: string;
  private _calories: number;
  private _protein: number;
  private _carbs: number;
  private _fat: number;
  private _fiber: number;
  private _sugar: number;
  private _loggedAt: string;
  private _userId: number;

  constructor(props: MealRecordProps) {
    this._id           = props.id;
    this._foodItemId   = props.foodItemId;
    this._foodItemName = props.foodItemName;
    this._mealType     = props.mealType;
    this._quantity     = props.quantity;
    this._unit         = props.unit;
    this._calories     = props.calories;
    this._protein      = props.protein;
    this._carbs        = props.carbs;
    this._fat          = props.fat;
    this._fiber        = props.fiber;
    this._sugar        = props.sugar;
    this._loggedAt     = props.loggedAt;
    this._userId       = props.userId;
  }

  // ─── Getters & Setters ────────────────────────────────────────────────────

  get id(): number { return this._id; }
  set id(v: number) { this._id = v; }

  get foodItemId(): number { return this._foodItemId; }
  set foodItemId(v: number) { this._foodItemId = v; }

  get foodItemName(): string { return this._foodItemName; }
  set foodItemName(v: string) { this._foodItemName = v; }

  get mealType(): MealType { return this._mealType; }
  set mealType(v: MealType) { this._mealType = v; }

  get quantity(): number { return this._quantity; }
  set quantity(v: number) { this._quantity = v; }

  get unit(): string { return this._unit; }
  set unit(v: string) { this._unit = v; }

  get calories(): number { return this._calories; }
  set calories(v: number) { this._calories = v; }

  get protein(): number { return this._protein; }
  set protein(v: number) { this._protein = v; }

  get carbs(): number { return this._carbs; }
  set carbs(v: number) { this._carbs = v; }

  get fat(): number { return this._fat; }
  set fat(v: number) { this._fat = v; }

  get fiber(): number { return this._fiber; }
  set fiber(v: number) { this._fiber = v; }

  get sugar(): number { return this._sugar; }
  set sugar(v: number) { this._sugar = v; }

  get loggedAt(): string { return this._loggedAt; }
  set loggedAt(v: string) { this._loggedAt = v; }

  get userId(): number { return this._userId; }
  set userId(v: number) { this._userId = v; }

  // ─── Domain Behaviour ─────────────────────────────────────────────────────

  /**
   * Compact macro summary string for display in meal section rows.
   *
   * @returns e.g. "P 47g · C 0g · G 5g"
   */
  get macroSummary(): string {
    return `P ${this._protein}g · C ${this._carbs}g · G ${this._fat}g`;
  }

  /**
   * Checks whether this record was logged today (in local time).
   *
   * @returns `true` if {@link loggedAt} falls on today's date.
   */
  get isFromToday(): boolean {
    const today = new Date().toDateString();
    return new Date(this._loggedAt).toDateString() === today;
  }
}
