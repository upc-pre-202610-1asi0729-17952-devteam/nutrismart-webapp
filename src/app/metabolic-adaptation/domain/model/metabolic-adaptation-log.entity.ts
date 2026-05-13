import { BaseEntity } from '../../../shared/infrastructure/base-entity';
import { MetabolicChangeTrigger } from './metabolic-change-trigger.enum';

/** Significant-change threshold in kcal. */
const SIGNIFICANT_CALORIE_DELTA = 100;

export interface MetabolicAdaptationLogProps {
  id?:              number;
  userId:           number;
  triggeredBy:      MetabolicChangeTrigger;
  previousCalories: number;
  newCalories:      number;
  previousProtein:  number;
  newProtein:       number;
  previousCarbs:    number;
  newCarbs:         number;
  previousFat:      number;
  newFat:           number;
  changedAt:        string;
}

/**
 * Immutable audit record of a metabolic target recalculation.
 *
 * Captures the before/after macro snapshot and the root cause so the
 * user can understand *why* their calorie or macro targets changed.
 */
export class MetabolicAdaptationLog implements BaseEntity {
  private _id:              number;
  private _userId:          number;
  private _triggeredBy:     MetabolicChangeTrigger;
  private _previousCalories: number;
  private _newCalories:     number;
  private _previousProtein: number;
  private _newProtein:      number;
  private _previousCarbs:   number;
  private _newCarbs:        number;
  private _previousFat:     number;
  private _newFat:          number;
  private _changedAt:       string;

  constructor(props: MetabolicAdaptationLogProps) {
    this._id               = props.id ?? 0;
    this._userId           = props.userId;
    this._triggeredBy      = props.triggeredBy;
    this._previousCalories = props.previousCalories;
    this._newCalories      = props.newCalories;
    this._previousProtein  = props.previousProtein;
    this._newProtein       = props.newProtein;
    this._previousCarbs    = props.previousCarbs;
    this._newCarbs         = props.newCarbs;
    this._previousFat      = props.previousFat;
    this._newFat           = props.newFat;
    this._changedAt        = props.changedAt;
  }

  // ─── Getters ──────────────────────────────────────────────────────────────

  get id(): number { return this._id; }
  set id(value: number) { this._id = value; }

  get userId(): number { return this._userId; }
  get triggeredBy(): MetabolicChangeTrigger { return this._triggeredBy; }
  get previousCalories(): number { return this._previousCalories; }
  get newCalories(): number { return this._newCalories; }
  get previousProtein(): number { return this._previousProtein; }
  get newProtein(): number { return this._newProtein; }
  get previousCarbs(): number { return this._previousCarbs; }
  get newCarbs(): number { return this._newCarbs; }
  get previousFat(): number { return this._previousFat; }
  get newFat(): number { return this._newFat; }
  get changedAt(): string { return this._changedAt; }

  // ─── Business Methods ─────────────────────────────────────────────────────

  /**
   * Signed calorie difference between the new and previous targets.
   *
   * @returns Positive value means an increase; negative means a decrease.
   */
  calorieDelta(): number {
    return this._newCalories - this._previousCalories;
  }

  /**
   * Whether the calorie change exceeds the {@link SIGNIFICANT_CALORIE_DELTA} threshold.
   *
   * Used to surface only meaningful adaptations in the UI.
   */
  isSignificantChange(): boolean {
    return Math.abs(this.calorieDelta()) >= SIGNIFICANT_CALORIE_DELTA;
  }

  /**
   * Human-readable one-liner suitable for an audit list item.
   *
   * @returns A string in the form `"+150 kcal (GOAL_SWITCH)"`.
   */
  summary(): string {
    const delta = this.calorieDelta();
    const sign  = delta >= 0 ? '+' : '';
    return `${sign}${delta} kcal (${this._triggeredBy})`;
  }

  // ─── Factory ──────────────────────────────────────────────────────────────

  /**
   * Creates a new log entry capturing the transition from previous to new targets.
   *
   * @param userId           - Owner of the metabolic targets.
   * @param triggeredBy      - Root cause of the recalculation.
   * @param previousCalories - Calorie target before the change.
   * @param newCalories      - Calorie target after the change.
   * @param previousProtein  - Protein target before the change.
   * @param newProtein       - Protein target after the change.
   * @param previousCarbs    - Carbohydrate target before the change.
   * @param newCarbs         - Carbohydrate target after the change.
   * @param previousFat      - Fat target before the change.
   * @param newFat           - Fat target after the change.
   * @param now              - ISO timestamp (defaults to current time).
   */
  static create(
    userId:           number,
    triggeredBy:      MetabolicChangeTrigger,
    previousCalories: number,
    newCalories:      number,
    previousProtein:  number,
    newProtein:       number,
    previousCarbs:    number,
    newCarbs:         number,
    previousFat:      number,
    newFat:           number,
    now:              string = new Date().toISOString(),
  ): MetabolicAdaptationLog {
    return new MetabolicAdaptationLog({
      userId,
      triggeredBy,
      previousCalories,
      newCalories,
      previousProtein,
      newProtein,
      previousCarbs,
      newCarbs,
      previousFat,
      newFat,
      changedAt: now,
    });
  }
}
