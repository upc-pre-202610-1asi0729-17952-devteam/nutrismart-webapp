import { BaseEntity } from '../../../shared/infrastructure/base-entity';
import { DietaryRestriction } from '../../../iam/domain/model/dietary-restriction.enum';

/**
 * Constructor DTO for creating a {@link FoodItem} instance.
 *
 * @author Mora Rivera, Joel Fernando
 */
export interface FoodItemProps {
  /** Unique numeric identifier assigned by the backend. */
  id: number;
  /** Human-readable food name (e.g. "Grilled chicken breast"). */
  name: string;
  /** Data source or brand (e.g. "USDA FoodData", "Open Food Facts"). */
  source: string;
  /** Serving size in the unit expressed by {@link servingUnit}. */
  servingSize: number;
  /** Unit of the serving size: "g", "ml", or "unit". */
  servingUnit: string;
  /** Kilocalories per 100 g of the food. */
  caloriesPer100g: number;
  /** Protein grams per 100 g. */
  proteinPer100g: number;
  /** Carbohydrate grams per 100 g. */
  carbsPer100g: number;
  /** Fat grams per 100 g. */
  fatPer100g: number;
  /** Dietary fibre grams per 100 g. */
  fiberPer100g: number;
  /** Sugar grams per 100 g. */
  sugarPer100g: number;
  /** Dietary restrictions this food conflicts with. */
  restrictions: DietaryRestriction[];
}

/**
 * Domain entity representing a food item in the nutritional database.
 *
 * Non-anemic: exposes a domain behaviour method ({@link getNutrientsForQuantity})
 * that scales all macros proportionally to a given serving quantity.
 *
 * @author Mora Rivera, Joel Fernando
 */
export class FoodItem implements BaseEntity {
  private _id: number;
  private _name: string;
  private _source: string;
  private _servingSize: number;
  private _servingUnit: string;
  private _caloriesPer100g: number;
  private _proteinPer100g: number;
  private _carbsPer100g: number;
  private _fatPer100g: number;
  private _fiberPer100g: number;
  private _sugarPer100g: number;
  private _restrictions: DietaryRestriction[];

  constructor(props: FoodItemProps) {
    this._id             = props.id;
    this._name           = props.name;
    this._source         = props.source;
    this._servingSize    = props.servingSize;
    this._servingUnit    = props.servingUnit;
    this._caloriesPer100g = props.caloriesPer100g;
    this._proteinPer100g  = props.proteinPer100g;
    this._carbsPer100g    = props.carbsPer100g;
    this._fatPer100g      = props.fatPer100g;
    this._fiberPer100g    = props.fiberPer100g;
    this._sugarPer100g    = props.sugarPer100g;
    this._restrictions    = [...props.restrictions];
  }

  // ─── Getters & Setters ────────────────────────────────────────────────────

  /** Unique numeric identifier. */
  get id(): number { return this._id; }
  set id(v: number) { this._id = v; }

  /** Human-readable food name. */
  get name(): string { return this._name; }
  set name(v: string) { this._name = v; }

  /** Data source or brand. */
  get source(): string { return this._source; }
  set source(v: string) { this._source = v; }

  /** Default serving size in {@link servingUnit}. */
  get servingSize(): number { return this._servingSize; }
  set servingSize(v: number) { this._servingSize = v; }

  /** Unit of the default serving size. */
  get servingUnit(): string { return this._servingUnit; }
  set servingUnit(v: string) { this._servingUnit = v; }

  /** Kilocalories per 100 g. */
  get caloriesPer100g(): number { return this._caloriesPer100g; }
  set caloriesPer100g(v: number) { this._caloriesPer100g = v; }

  /** Protein grams per 100 g. */
  get proteinPer100g(): number { return this._proteinPer100g; }
  set proteinPer100g(v: number) { this._proteinPer100g = v; }

  /** Carbohydrate grams per 100 g. */
  get carbsPer100g(): number { return this._carbsPer100g; }
  set carbsPer100g(v: number) { this._carbsPer100g = v; }

  /** Fat grams per 100 g. */
  get fatPer100g(): number { return this._fatPer100g; }
  set fatPer100g(v: number) { this._fatPer100g = v; }

  /** Dietary fibre grams per 100 g. */
  get fiberPer100g(): number { return this._fiberPer100g; }
  set fiberPer100g(v: number) { this._fiberPer100g = v; }

  /** Sugar grams per 100 g. */
  get sugarPer100g(): number { return this._sugarPer100g; }
  set sugarPer100g(v: number) { this._sugarPer100g = v; }

  /** Dietary restrictions this food conflicts with. Returns a copy. */
  get restrictions(): DietaryRestriction[] { return [...this._restrictions]; }
  set restrictions(v: DietaryRestriction[]) { this._restrictions = [...v]; }

  // ─── Domain Behaviour ─────────────────────────────────────────────────────

  /**
   * Returns all macros scaled proportionally to a given quantity.
   *
   * All values are rounded to one decimal place.
   *
   * @param quantity - Amount in the same unit as {@link servingUnit}.
   * @returns Object containing calories, protein, carbs, fat, fiber and sugar
   *          for the requested quantity.
   */
  getNutrientsForQuantity(quantity: number): {
    calories: number; protein: number; carbs: number;
    fat: number; fiber: number; sugar: number;
  } {
    const f = quantity / 100;
    return {
      calories: Math.round(this._caloriesPer100g * f * 10) / 10,
      protein:  Math.round(this._proteinPer100g  * f * 10) / 10,
      carbs:    Math.round(this._carbsPer100g    * f * 10) / 10,
      fat:      Math.round(this._fatPer100g      * f * 10) / 10,
      fiber:    Math.round(this._fiberPer100g    * f * 10) / 10,
      sugar:    Math.round(this._sugarPer100g    * f * 10) / 10,
    };
  }

  /**
   * Checks whether this food conflicts with any of the given restrictions.
   *
   * @param activeRestrictions - The user's active dietary restrictions.
   * @returns `true` if any restriction matches.
   */
  isRestrictedFor(activeRestrictions: DietaryRestriction[]): boolean {
    return this._restrictions.some(r => activeRestrictions.includes(r));
  }

  /**
   * Returns only the restrictions that conflict with the user's active list.
   *
   * @param activeRestrictions - The user's active dietary restrictions.
   * @returns Subset of restrictions that conflict.
   */
  conflictingRestrictions(activeRestrictions: DietaryRestriction[]): DietaryRestriction[] {
    return this._restrictions.filter(r => activeRestrictions.includes(r));
  }
}
