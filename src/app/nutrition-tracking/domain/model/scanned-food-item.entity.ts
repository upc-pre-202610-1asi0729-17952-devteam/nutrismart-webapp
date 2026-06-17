import { BaseEntity } from '../../../shared/infrastructure/base-entity';
import { DietaryRestriction } from '../../../iam/domain/model/dietary-restriction.enum';
import { MacronutrientDistribution } from './macronutrient-distribution.value-object';

export interface ScannedFoodItemProps {
  id: number;
  foodItemId: number | null;
  name: string;
  nameEs: string | null;
  nameKey: string | null;
  quantityGrams: number;
  macros: MacronutrientDistribution;
  restrictions: DietaryRestriction[];
  isEdited: boolean;
  isEstimate: boolean;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
}

/**
 * A single food item detected within a plate-scan session.
 *
 * Belongs to the Nutrition Tracking bounded context as a component of
 * {@link ScanResult} (plate-scan aggregate).
 *
 * @author Del Aguila Del Aguila, Olenka Priscilla
 */
export class ScannedFoodItem implements BaseEntity {
  private _id: number;
  private _foodItemId: number | null;
  private _name: string;
  private _nameEs: string | null;
  private _nameKey: string | null;
  private _quantityGrams: number;
  private _macros: MacronutrientDistribution;
  private _restrictions: DietaryRestriction[];
  private _isEdited: boolean;
  private _isEstimate: boolean;
  private _caloriesPer100g: number;
  private _proteinPer100g: number;
  private _carbsPer100g: number;
  private _fatPer100g: number;

  constructor(props: ScannedFoodItemProps) {
    this._id             = props.id;
    this._foodItemId     = props.foodItemId ?? null;
    this._name           = props.name;
    this._nameEs         = props.nameEs ?? null;
    this._nameKey        = props.nameKey ?? null;
    this._quantityGrams  = props.quantityGrams;
    this._macros         = props.macros;
    this._restrictions   = [...props.restrictions];
    this._isEdited       = props.isEdited;
    this._isEstimate     = props.isEstimate;
    this._caloriesPer100g = props.caloriesPer100g;
    this._proteinPer100g  = props.proteinPer100g;
    this._carbsPer100g    = props.carbsPer100g;
    this._fatPer100g      = props.fatPer100g;
  }

  // ─── Getters & Setters ────────────────────────────────────────────────────

  get id(): number { return this._id; }
  set id(v: number) { this._id = v; }

  get foodItemId(): number | null { return this._foodItemId; }

  get name(): string { return this._name; }
  set name(v: string) { this._name = v; }

  get nameEs(): string | null { return this._nameEs; }

  get nameKey(): string | null { return this._nameKey; }

  get quantityGrams(): number { return this._quantityGrams; }
  set quantityGrams(v: number) { this._quantityGrams = v; }

  get macros(): MacronutrientDistribution { return this._macros; }

  get calories(): number { return this._macros.calories; }
  get protein(): number  { return this._macros.protein; }
  get carbs(): number    { return this._macros.carbs; }
  get fat(): number      { return this._macros.fat; }

  get restrictions(): DietaryRestriction[] { return [...this._restrictions]; }
  set restrictions(v: DietaryRestriction[]) { this._restrictions = [...v]; }

  get isEdited(): boolean { return this._isEdited; }
  set isEdited(v: boolean) { this._isEdited = v; }

  get isEstimate(): boolean { return this._isEstimate; }

  get caloriesPer100g(): number { return this._caloriesPer100g; }
  get proteinPer100g(): number  { return this._proteinPer100g; }
  get carbsPer100g(): number    { return this._carbsPer100g; }
  get fatPer100g(): number      { return this._fatPer100g; }

  // ─── Domain Behaviour ─────────────────────────────────────────────────────

  get macroLabel(): string {
    return `P${Math.round(this._macros.protein)} C${Math.round(this._macros.carbs)} G${Math.round(this._macros.fat)}`;
  }

  rescaleForQuantity(newQuantityGrams: number): void {
    if (this._quantityGrams === 0) return;
    const ratio = newQuantityGrams / this._quantityGrams;
    this._macros = this._macros.scale(ratio);
    this._quantityGrams = newQuantityGrams;
    this._isEdited = true;
  }

  getLocalizedName(lang: string): string {
    return (lang === 'es' && this._nameEs) ? this._nameEs : this._name;
  }

  isRestrictedFor(activeRestrictions: DietaryRestriction[]): boolean {
    return this._restrictions.some(r => activeRestrictions.includes(r));
  }
}
