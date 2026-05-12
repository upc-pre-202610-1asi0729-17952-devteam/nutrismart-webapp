import { BaseEntity } from '../../../shared/infrastructure/base-entity';
import { WeatherType } from './weather-type.enum';
import { ContextualTargetAdjustment } from './contextual-target-adjustment.value-object';

export interface WeatherContextProps {
  id: number;
  /** Raw snapshot ID from the persistence layer (e.g. "ws-1"). Used to reference this city in recommendation-cards. */
  snapshotId: string;
  city: string;
  country: string;
  temperatureCelsius: number;
  condition: string;
  weatherType: WeatherType;
  updatedAt: string;
}

export class WeatherContext implements BaseEntity {
  #id: number;
  #snapshotId: string;
  #city: string;
  #country: string;
  #temperatureCelsius: number;
  #condition: string;
  #weatherType: WeatherType;
  #updatedAt: string;

  constructor(props: WeatherContextProps) {
    this.#id                 = props.id;
    this.#snapshotId         = props.snapshotId;
    this.#city               = props.city;
    this.#country            = props.country;
    this.#temperatureCelsius = props.temperatureCelsius;
    this.#condition          = props.condition;
    this.#weatherType        = props.weatherType;
    this.#updatedAt          = props.updatedAt;
  }

  get id(): number { return this.#id; }
  set id(v: number) { this.#id = v; }

  get snapshotId(): string { return this.#snapshotId; }
  set snapshotId(v: string) { this.#snapshotId = v; }

  get city(): string { return this.#city; }
  set city(v: string) { this.#city = v; }

  get country(): string { return this.#country; }
  set country(v: string) { this.#country = v; }

  get temperatureCelsius(): number { return this.#temperatureCelsius; }
  set temperatureCelsius(v: number) { this.#temperatureCelsius = v; }

  get condition(): string { return this.#condition; }
  set condition(v: string) { this.#condition = v; }

  get weatherType(): WeatherType { return this.#weatherType; }
  set weatherType(v: WeatherType) { this.#weatherType = v; }

  get updatedAt(): string { return this.#updatedAt; }
  set updatedAt(v: string) { this.#updatedAt = v; }

  // ─── Domain Behaviour ─────────────────────────────────────────────────────

  isHot(): boolean {
    return this.#temperatureCelsius >= 21;
  }

  isCold(): boolean {
    return this.#temperatureCelsius < 21;
  }

  isMild(): boolean {
    return false;
  }

  formattedLabel(): string {
    return `${this.#city} · ${this.#temperatureCelsius}°C`;
  }

  /**
   * Returns the calorie adjustment factor for this weather context.
   *
   * Extreme heat (≥ 35 °C) suppresses appetite slightly (−3 %).
   * Extreme cold (≤ 5 °C) increases thermogenic expenditure (+5 %).
   * All other conditions produce no adjustment (factor = 1).
   */
  calorieAdjustmentFactor(): ContextualTargetAdjustment {
    let factor = 1;
    if (this.#temperatureCelsius >= 35) {
      factor = 0.97;
    } else if (this.#temperatureCelsius <= 5) {
      factor = 1.05;
    }
    return new ContextualTargetAdjustment(factor, 'recommendations.context_adjustment.weather', 'WEATHER');
  }
}
