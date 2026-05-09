import { BaseEntity } from '../../../shared/infrastructure/base-entity';

/**
 * Categories an ingredient can belong to.
 *
 * @author Del Aguila Del Aguila, Olenka Priscilla
 */
export type IngredientCategory =
  | 'Grain'
  | 'Animal protein'
  | 'Vegetable'
  | 'Fruit'
  | 'Dairy'
  | 'Legume'
  | 'Seasoning'
  | 'Other';

/**
 * Constructor DTO for creating a {@link PantryItem} instance.
 *
 * @author Del Aguila Del Aguila, Olenka Priscilla
 */
export interface PantryItemProps {
  id: number;
  name: string;
  category: IngredientCategory;
  quantityGrams: number;
  caloriesPer100g: number;
  userId: number;
  addedAt: string;
}

/**
 * Domain entity representing a single ingredient stored in the user's pantry.
 *
 * Non-anemic: exposes {@link totalCalories} and {@link isSameIngredient} domain
 * behaviour so the store never manipulates raw numbers.
 *
 * @author Del Aguila Del Aguila, Olenka Priscilla
 */
export class PantryItem implements BaseEntity {
  private _id: number;
  private _name: string;
  private _category: IngredientCategory;
  private _quantityGrams: number;
  private _caloriesPer100g: number;
  private _userId: number;
  private _addedAt: string;

  constructor(props: PantryItemProps) {
    this._id              = props.id;
    this._name            = props.name;
    this._category        = props.category;
    this._quantityGrams   = props.quantityGrams;
    this._caloriesPer100g = props.caloriesPer100g;
    this._userId          = props.userId;
    this._addedAt         = props.addedAt;
  }

  // ─── Getters & Setters ────────────────────────────────────────────────────

  get id(): number { return this._id; }
  set id(v: number) { this._id = v; }

  get name(): string { return this._name; }
  set name(v: string) { this._name = v; }

  get category(): IngredientCategory { return this._category; }
  set category(v: IngredientCategory) { this._category = v; }

  get quantityGrams(): number { return this._quantityGrams; }
  set quantityGrams(v: number) { this._quantityGrams = v; }

  get caloriesPer100g(): number { return this._caloriesPer100g; }
  set caloriesPer100g(v: number) { this._caloriesPer100g = v; }

  get userId(): number { return this._userId; }
  set userId(v: number) { this._userId = v; }

  get addedAt(): string { return this._addedAt; }
  set addedAt(v: string) { this._addedAt = v; }

  // ─── Domain Behaviour ─────────────────────────────────────────────────────

  /**
   * Calories contributed by the stored quantity of this ingredient.
   *
   * @returns Kilocalories rounded to one decimal.
   */
  get totalCalories(): number {
    return Math.round((this._caloriesPer100g * this._quantityGrams) / 100 * 10) / 10;
  }

  /**
   * Checks whether another pantry item represents the same ingredient
   * (case-insensitive name comparison).
   *
   * @param other - Another item to compare.
   * @returns `true` if names match (ignoring case).
   */
  isSameIngredient(other: PantryItem): boolean {
    return this._name.toLowerCase() === other.name.toLowerCase();
  }

  /**
   * Merges a quantity addition into this item.
   *
   * @param additionalGrams - Grams to add to the current quantity.
   */
  addQuantity(additionalGrams: number): void {
    this._quantityGrams += additionalGrams;
  }
}
