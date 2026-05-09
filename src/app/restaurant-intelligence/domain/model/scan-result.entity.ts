import { BaseEntity } from '../../../shared/infrastructure/base-entity';
import { ScannedFoodItem } from './scanned-food-item.entity';
import { MealType } from '../../../nutrition-tracking/domain/model/meal-type.enum';

/** Possible processing states for a plate-scan session. */
export type ScanStatus = 'analyzing' | 'success' | 'invalid';

/**
 * Constructor DTO for creating a {@link ScanResult} instance.
 *
 * @author Del Aguila Del Aguila, Olenka Priscilla
 */
export interface ScanResultProps {
  id: number;
  status: ScanStatus;
  imageBase64: string;
  detectedItems: ScannedFoodItem[];
  mealType: MealType;
  source: string;
  scannedAt: string;
}

/**
 * Aggregate root for a plate-photo scan session.
 *
 * Non-anemic: owns the list of detected items and exposes domain operations
 * ({@link totalCalories}, {@link confirmItem}, {@link removeItem}).
 *
 * @author Del Aguila Del Aguila, Olenka Priscilla
 */
export class ScanResult implements BaseEntity {
  private _id: number;
  private _status: ScanStatus;
  private _imageBase64: string;
  private _detectedItems: ScannedFoodItem[];
  private _mealType: MealType;
  private _source: string;
  private _scannedAt: string;

  constructor(props: ScanResultProps) {
    this._id            = props.id;
    this._status        = props.status;
    this._imageBase64   = props.imageBase64;
    this._detectedItems = props.detectedItems.map(i => new ScannedFoodItem({
      id: i.id, name: i.name, quantityGrams: i.quantityGrams,
      calories: i.calories, protein: i.protein, carbs: i.carbs,
      fat: i.fat, restrictions: i.restrictions, isEdited: i.isEdited,
    }));
    this._mealType   = props.mealType;
    this._source     = props.source;
    this._scannedAt  = props.scannedAt;
  }

  // ─── Getters & Setters ────────────────────────────────────────────────────

  get id(): number { return this._id; }
  set id(v: number) { this._id = v; }

  get status(): ScanStatus { return this._status; }
  set status(v: ScanStatus) { this._status = v; }

  get imageBase64(): string { return this._imageBase64; }
  set imageBase64(v: string) { this._imageBase64 = v; }

  get detectedItems(): ScannedFoodItem[] { return [...this._detectedItems]; }

  get mealType(): MealType { return this._mealType; }
  set mealType(v: MealType) { this._mealType = v; }

  get source(): string { return this._source; }
  set source(v: string) { this._source = v; }

  get scannedAt(): string { return this._scannedAt; }
  set scannedAt(v: string) { this._scannedAt = v; }

  // ─── Domain Behaviour ─────────────────────────────────────────────────────

  /** Sum of kilocalories across all detected items. */
  get totalCalories(): number {
    return Math.round(this._detectedItems.reduce((sum, i) => sum + i.calories, 0) * 10) / 10;
  }

  /** Whether the scan produced at least one identifiable food item. */
  get hasItems(): boolean {
    return this._detectedItems.length > 0;
  }

  /**
   * Updates the quantity of a detected item and rescales its macros.
   *
   * @param itemId       - ID of the item to update.
   * @param newQuantity  - New quantity in grams.
   */
  updateItemQuantity(itemId: number, newQuantity: number): void {
    const item = this._detectedItems.find(i => i.id === itemId);
    if (!item) return;
    item.rescaleForQuantity(newQuantity);
  }

  /**
   * Removes a detected item from the scan result.
   *
   * @param itemId - ID of the item to remove.
   */
  removeItem(itemId: number): void {
    this._detectedItems = this._detectedItems.filter(i => i.id !== itemId);
  }

  /** Transitions the aggregate to the success state (MealPhotoAnalyzed). */
  markAsSuccess(): void {
    this._status = 'success';
  }

  /** Transitions the aggregate to the invalid state (image not recognized). */
  markAsInvalid(): void {
    this._status = 'invalid';
  }
}
