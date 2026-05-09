import { BaseEntity } from '../../../shared/infrastructure/base-entity';
import { DietaryRestriction } from '../../../iam/domain/model/dietary-restriction.enum';

/**
 * Constructor DTO for creating a {@link ScannedFoodItem} instance.
 *
 * @author Del Aguila Del Aguila, Olenka Priscilla
 */
export interface ScannedFoodItemProps {
  id: number;
  name: string;
  nameKey: string | null;
  quantityGrams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  restrictions: DietaryRestriction[];
  isEdited: boolean;
}

/**
 * Domain entity representing a single food item detected from a meal photo.
 *
 * Non-anemic: encapsulates business logic for macro scaling when quantity
 * changes ({@link rescaleForQuantity}) and restriction conflict checks.
 *
 * @author Del Aguila Del Aguila, Olenka Priscilla
 */
export class ScannedFoodItem implements BaseEntity {
  private _id: number;
  private _name: string;
  private _nameKey: string | null;
  private _quantityGrams: number;
  private _calories: number;
  private _protein: number;
  private _carbs: number;
  private _fat: number;
  private _restrictions: DietaryRestriction[];
  private _isEdited: boolean;

  constructor(props: ScannedFoodItemProps) {
    this._id            = props.id;
    this._name          = props.name;
    this._nameKey       = props.nameKey ?? null;
    this._quantityGrams = props.quantityGrams;
    this._calories      = props.calories;
    this._protein       = props.protein;
    this._carbs         = props.carbs;
    this._fat           = props.fat;
    this._restrictions  = [...props.restrictions];
    this._isEdited      = props.isEdited;
  }

  // ─── Getters & Setters ────────────────────────────────────────────────────

  get id(): number { return this._id; }
  set id(v: number) { this._id = v; }

  get name(): string { return this._name; }
  set name(v: string) { this._name = v; }

  get nameKey(): string | null { return this._nameKey; }

  get quantityGrams(): number { return this._quantityGrams; }
  set quantityGrams(v: number) { this._quantityGrams = v; }

  get calories(): number { return this._calories; }
  set calories(v: number) { this._calories = v; }

  get protein(): number { return this._protein; }
  set protein(v: number) { this._protein = v; }

  get carbs(): number { return this._carbs; }
  set carbs(v: number) { this._carbs = v; }

  get fat(): number { return this._fat; }
  set fat(v: number) { this._fat = v; }

  get restrictions(): DietaryRestriction[] { return [...this._restrictions]; }
  set restrictions(v: DietaryRestriction[]) { this._restrictions = [...v]; }

  get isEdited(): boolean { return this._isEdited; }
  set isEdited(v: boolean) { this._isEdited = v; }

  // ─── Domain Behaviour ─────────────────────────────────────────────────────

  /**
   * Returns a compact macro label for display in the scan result list.
   *
   * @returns e.g. "P47 C0 G5"
   */
  get macroLabel(): string {
    return `P${this._protein} C${this._carbs} G${this._fat}`;
  }

  /**
   * Rescales all macros proportionally to a new quantity.
   *
   * The original base quantity is used as the scaling denominator so the
   * entity remains consistent after the user edits the gram value.
   *
   * @param newQuantityGrams - Desired serving size in grams.
   */
  rescaleForQuantity(newQuantityGrams: number): void {
    if (this._quantityGrams === 0) return;
    const ratio = newQuantityGrams / this._quantityGrams;
    this._calories = Math.round(this._calories * ratio * 10) / 10;
    this._protein  = Math.round(this._protein  * ratio * 10) / 10;
    this._carbs    = Math.round(this._carbs    * ratio * 10) / 10;
    this._fat      = Math.round(this._fat      * ratio * 10) / 10;
    this._quantityGrams = newQuantityGrams;
    this._isEdited = true;
  }

  /**
   * Checks whether this item conflicts with any of the user's active restrictions.
   *
   * @param activeRestrictions - The user's current dietary restrictions.
   * @returns `true` if at least one restriction matches.
   */
  isRestrictedFor(activeRestrictions: DietaryRestriction[]): boolean {
    return this._restrictions.some(r => activeRestrictions.includes(r));
  }
}
