import { BaseEntity } from '../../../shared/infrastructure/base-entity';
import { DietaryRestriction } from '../../../iam/domain/model/dietary-restriction.enum';

export interface RankedDishProps {
  rank: number;
  name: string;
  nameKey: string | null;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  compatibilityScore: number;
  justification: string;
  justificationKey: string | null;
  conflictingRestrictions?: DietaryRestriction[];
}

export class RankedDish {
  readonly rank: number;
  readonly name: string;
  readonly nameKey: string | null;
  readonly calories: number;
  readonly protein: number;
  readonly carbs: number;
  readonly fat: number;
  readonly compatibilityScore: number;
  readonly justification: string;
  readonly justificationKey: string | null;
  readonly conflictingRestrictions: DietaryRestriction[];

  constructor(props: RankedDishProps) {
    this.rank                   = props.rank;
    this.name                   = props.name;
    this.nameKey                = props.nameKey;
    this.calories               = props.calories;
    this.protein                = props.protein;
    this.carbs                  = props.carbs;
    this.fat                    = props.fat;
    this.compatibilityScore     = props.compatibilityScore;
    this.justification          = props.justification;
    this.justificationKey       = props.justificationKey;
    this.conflictingRestrictions = [...(props.conflictingRestrictions ?? [])];
  }

  formattedScore(): string {
    return `${this.compatibilityScore}%`;
  }

  firstConflict(activeRestrictions: DietaryRestriction[]): DietaryRestriction | null {
    return this.conflictingRestrictions.find(r => activeRestrictions.includes(r)) ?? null;
  }
}

export interface RestrictedDishProps {
  name: string;
  nameKey: string | null;
  restriction: DietaryRestriction;
}

export class RestrictedDish {
  readonly name: string;
  readonly nameKey: string | null;
  readonly restriction: DietaryRestriction;

  constructor(props: RestrictedDishProps) {
    this.name        = props.name;
    this.nameKey     = props.nameKey;
    this.restriction = props.restriction;
  }
}

export interface MenuAnalysisProps {
  id: number;
  rankedDishes: RankedDish[];
  restrictedDishes: RestrictedDish[];
  scannedAt: string;
  restaurantName: string;
}

export class MenuAnalysis implements BaseEntity {
  private _id: number;
  private _rankedDishes: RankedDish[];
  private _restrictedDishes: RestrictedDish[];
  private _scannedAt: string;
  private _restaurantName: string;

  constructor(props: MenuAnalysisProps) {
    this._id               = props.id;
    this._rankedDishes     = [...props.rankedDishes].sort((a, b) => a.rank - b.rank);
    this._restrictedDishes = [...props.restrictedDishes];
    this._scannedAt        = props.scannedAt;
    this._restaurantName   = props.restaurantName;
  }

  // ─── Getters ──────────────────────────────────────────────────────────────

  get id(): number { return this._id; }
  set id(v: number) { this._id = v; }

  get rankedDishes(): RankedDish[] { return [...this._rankedDishes]; }
  get restrictedDishes(): RestrictedDish[] { return [...this._restrictedDishes]; }

  get scannedAt(): string { return this._scannedAt; }
  set scannedAt(v: string) { this._scannedAt = v; }

  get restaurantName(): string { return this._restaurantName; }
  set restaurantName(v: string) { this._restaurantName = v; }

  // ─── Domain Behaviour ─────────────────────────────────────────────────────

  get bestDish(): RankedDish | null {
    return this._rankedDishes[0] ?? null;
  }

  get alternatives(): RankedDish[] {
    return this._rankedDishes.slice(1);
  }

  get hasRestrictedDishes(): boolean {
    return this._restrictedDishes.length > 0;
  }

  get hasCompatibleDishes(): boolean {
    return this._rankedDishes.length > 0;
  }

  /**
   * Filters the ranked dishes against active dietary restrictions and returns
   * a new MenuAnalysis where incompatible dishes are moved to restrictedDishes.
   *
   * Implements restaurantMenu.analyzeCompatibility() from the domain model.
   */
  analyzeCompatibility(activeRestrictions: DietaryRestriction[]): MenuAnalysis {
    if (activeRestrictions.length === 0) return this;

    const compatible: RankedDish[]   = [];
    const restricted: RestrictedDish[] = [];

    for (const dish of this._rankedDishes) {
      const conflict = dish.firstConflict(activeRestrictions);
      if (conflict) {
        restricted.push(new RestrictedDish({ name: dish.name, nameKey: dish.nameKey, restriction: conflict }));
      } else {
        compatible.push(dish);
      }
    }

    return new MenuAnalysis({
      id:               this._id,
      scannedAt:        this._scannedAt,
      restaurantName:   this._restaurantName,
      rankedDishes:     compatible.map((d, i) => new RankedDish({ ...d, rank: i + 1 })),
      restrictedDishes: restricted,
    });
  }
}
