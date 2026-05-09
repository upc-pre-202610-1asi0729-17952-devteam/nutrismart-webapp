import { BaseEntity } from '../../../shared/infrastructure/base-entity';
import { DietaryRestriction } from '../../../iam/domain/model/dietary-restriction.enum';

/**
 * A single dish detected in a restaurant menu photo.
 *
 * Value object embedded within {@link MenuAnalysis}.
 *
 * @author Del Aguila Del Aguila, Olenka Priscilla
 */
export interface RankedDish {
  readonly rank: number;
  readonly name: string;
  readonly calories: number;
  readonly protein: number;
  readonly carbs: number;
  readonly fat: number;
  readonly compatibilityScore: number;
  readonly justification: string;
}

/**
 * A dish flagged as incompatible with the user's dietary restrictions.
 *
 * Value object embedded within {@link MenuAnalysis}.
 *
 * @author Del Aguila Del Aguila, Olenka Priscilla
 */
export interface RestrictedDish {
  readonly name: string;
  readonly restriction: DietaryRestriction;
}

/**
 * Constructor DTO for creating a {@link MenuAnalysis} instance.
 *
 * @author Del Aguila Del Aguila, Olenka Priscilla
 */
export interface MenuAnalysisProps {
  id: number;
  rankedDishes: RankedDish[];
  restrictedDishes: RestrictedDish[];
  scannedAt: string;
  restaurantName: string;
}

/**
 * Aggregate root for a restaurant-menu scan session.
 *
 * Non-anemic: exposes domain queries ({@link bestDish}, {@link alternatives},
 * {@link compatibilityLabel}) so the presentation layer never has to sort or
 * filter raw data.
 *
 * @author Del Aguila Del Aguila, Olenka Priscilla
 */
export class MenuAnalysis implements BaseEntity {
  private _id: number;
  private _rankedDishes: RankedDish[];
  private _restrictedDishes: RestrictedDish[];
  private _scannedAt: string;
  private _restaurantName: string;

  constructor(props: MenuAnalysisProps) {
    this._id              = props.id;
    this._rankedDishes    = [...props.rankedDishes].sort((a, b) => a.rank - b.rank);
    this._restrictedDishes = [...props.restrictedDishes];
    this._scannedAt       = props.scannedAt;
    this._restaurantName  = props.restaurantName;
  }

  // ─── Getters & Setters ────────────────────────────────────────────────────

  get id(): number { return this._id; }
  set id(v: number) { this._id = v; }

  get rankedDishes(): RankedDish[] { return [...this._rankedDishes]; }
  get restrictedDishes(): RestrictedDish[] { return [...this._restrictedDishes]; }

  get scannedAt(): string { return this._scannedAt; }
  set scannedAt(v: string) { this._scannedAt = v; }

  get restaurantName(): string { return this._restaurantName; }
  set restaurantName(v: string) { this._restaurantName = v; }

  // ─── Domain Behaviour ─────────────────────────────────────────────────────

  /**
   * The top-ranked dish (CompatibleDishesRanked[0]).
   *
   * @returns The best-match dish, or `null` when no compatible dishes were found.
   */
  get bestDish(): RankedDish | null {
    return this._rankedDishes[0] ?? null;
  }

  /**
   * All ranked dishes except the best match (rank > 1).
   */
  get alternatives(): RankedDish[] {
    return this._rankedDishes.slice(1);
  }

  /** Whether there are any flagged restricted dishes. */
  get hasRestrictedDishes(): boolean {
    return this._restrictedDishes.length > 0;
  }

  /** Whether at least one compatible dish was found. */
  get hasCompatibleDishes(): boolean {
    return this._rankedDishes.length > 0;
  }

  /**
   * Formatted compatibility percentage label for a dish.
   *
   * @param dish - A ranked dish from this analysis.
   * @returns e.g. "87%"
   */
  compatibilityLabel(dish: RankedDish): string {
    return `${dish.compatibilityScore}%`;
  }
}
