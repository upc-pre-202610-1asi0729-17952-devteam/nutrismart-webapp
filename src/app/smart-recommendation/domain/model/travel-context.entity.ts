import { BaseEntity } from '../../../shared/infrastructure/base-entity';
import { ContextualTargetAdjustment } from './contextual-target-adjustment.value-object';

export interface TravelContextProps {
  id: number;
  city: string;
  country: string;
  isActive: boolean;
  isManual: boolean;
  activatedAt: string;
}

export class TravelContext implements BaseEntity {
  #id: number;
  #city: string;
  #country: string;
  #isActive: boolean;
  #isManual: boolean;
  #activatedAt: string;

  constructor(props: TravelContextProps) {
    this.#id          = props.id;
    this.#city        = props.city;
    this.#country     = props.country;
    this.#isActive    = props.isActive;
    this.#isManual    = props.isManual;
    this.#activatedAt = props.activatedAt;
  }

  get id(): number { return this.#id; }
  set id(v: number) { this.#id = v; }

  get city(): string { return this.#city; }
  set city(v: string) { this.#city = v; }

  get country(): string { return this.#country; }
  set country(v: string) { this.#country = v; }

  get isActive(): boolean { return this.#isActive; }
  set isActive(v: boolean) { this.#isActive = v; }

  get isManual(): boolean { return this.#isManual; }
  set isManual(v: boolean) { this.#isManual = v; }

  get activatedAt(): string { return this.#activatedAt; }
  set activatedAt(v: string) { this.#activatedAt = v; }

  // ─── Domain Behaviour ─────────────────────────────────────────────────────

  isTravelActive(): boolean {
    return this.#isActive && this.#city.trim().length > 0;
  }

  hasManualCity(): boolean {
    return this.#isManual;
  }

  locationLabel(): string {
    return `${this.#city}, ${this.#country}`;
  }

  activate(city: string, country: string, manual: boolean): void {
    this.#city        = city;
    this.#country     = country;
    this.#isActive    = true;
    this.#isManual    = manual;
    this.#activatedAt = new Date().toISOString();
  }

  deactivate(): void {
    this.#isActive = false;
    this.#city     = '';
    this.#country  = '';
  }

  /**
   * Returns the calorie adjustment factor for this travel context.
   *
   * Manual trips (user-entered city) are assumed to involve active tourism (+10 %).
   * Auto-detected trips (business travel heuristic) apply a sedentary discount (−5 %).
   * Returns 1 when travel is not active.
   */
  calorieAdjustmentFactor(): ContextualTargetAdjustment {
    if (!this.isTravelActive()) {
      return new ContextualTargetAdjustment(1, 'recommendations.context_adjustment.travel', 'TRAVEL');
    }
    const factor = this.#isManual ? 1.10 : 0.95;
    return new ContextualTargetAdjustment(factor, 'recommendations.context_adjustment.travel', 'TRAVEL');
  }
}
