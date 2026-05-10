import { BaseEntity } from '../../../../shared/infrastructure/base-entity';
import { WeatherType } from './weather-type.enum';

/**
 * Constructor DTO for creating a {@link WeatherContext} instance.
 *
 * @author Espinoza Cruz, Angela Milagros
 */
export interface WeatherContextProps {
  /** Unique numeric identifier. */
  id: number;
  /** City name detected by geolocation or travel mode. */
  city: string;
  /** Country of the detected city. */
  country: string;
  /** Current temperature in degrees Celsius. */
  temperatureCelsius: number;
  /** Human-readable sky condition (e.g. "Sunny", "Cloudy"). */
  condition: string;
  /** Classified weather type driving recommendation logic. */
  weatherType: WeatherType;
  /** ISO timestamp of the last weather data refresh. */
  updatedAt: string;
}

/**
 * Domain entity representing the current weather context for a user session.
 *
 * Non-anemic: exposes domain behaviour methods {@link isHot}, {@link isCold},
 * {@link isMild}, and {@link formattedLabel} to prevent duplication of
 * weather classification logic in the presentation layer.
 *
 * @author Espinoza Cruz, Angela Milagros
 */
export class WeatherContext implements BaseEntity {
  #id: number;
  #city: string;
  #country: string;
  #temperatureCelsius: number;
  #condition: string;
  #weatherType: WeatherType;
  #updatedAt: string;

  constructor(props: WeatherContextProps) {
    this.#id                 = props.id;
    this.#city               = props.city;
    this.#country            = props.country;
    this.#temperatureCelsius = props.temperatureCelsius;
    this.#condition          = props.condition;
    this.#weatherType        = props.weatherType;
    this.#updatedAt          = props.updatedAt;
  }

  // ─── Getters & Setters ────────────────────────────────────────────────────

  /** Unique numeric identifier. */
  get id(): number { return this.#id; }
  set id(v: number) { this.#id = v; }

  /** City name. */
  get city(): string { return this.#city; }
  set city(v: string) { this.#city = v; }

  /** Country name. */
  get country(): string { return this.#country; }
  set country(v: string) { this.#country = v; }

  /** Temperature in °C. */
  get temperatureCelsius(): number { return this.#temperatureCelsius; }
  set temperatureCelsius(v: number) { this.#temperatureCelsius = v; }

  /** Sky condition description. */
  get condition(): string { return this.#condition; }
  set condition(v: string) { this.#condition = v; }

  /** Classified weather type. */
  get weatherType(): WeatherType { return this.#weatherType; }
  set weatherType(v: WeatherType) { this.#weatherType = v; }

  /** ISO timestamp of last refresh. */
  get updatedAt(): string { return this.#updatedAt; }
  set updatedAt(v: string) { this.#updatedAt = v; }

  // ─── Domain Behaviour ─────────────────────────────────────────────────────

  /**
   * Returns `true` when the weather type is classified as HOT.
   * Used by the recommendations view to select warm-weather suggestion sets.
   */
  isHot(): boolean {
    return this.#weatherType === WeatherType.HOT;
  }

  /**
   * Returns `true` when the weather type is classified as COLD.
   * Used by the recommendations view to select cold-weather suggestion sets.
   */
  isCold(): boolean {
    return this.#weatherType === WeatherType.COLD;
  }

  /**
   * Returns `true` when the weather type is classified as MILD.
   */
  isMild(): boolean {
    return this.#weatherType === WeatherType.MILD;
  }

  /**
   * Returns a short human-readable location + temperature label for the
   * header badge (e.g. "Lima · 31°C").
   */
  formattedLabel(): string {
    return `${this.#city} · ${this.#temperatureCelsius}°C`;
  }

  /**
   * Returns a relative "updated X mins ago" string based on {@link updatedAt}.
   *
   * @param now - Current date used to compute elapsed time. Defaults to `new Date()`.
   */
  updatedAgo(now: Date = new Date()): string {
    const diff = Math.round((now.getTime() - new Date(this.#updatedAt).getTime()) / 60000);
    if (diff < 1) return 'Just now';
    return `Updated ${diff} min${diff > 1 ? 's' : ''} ago`;
  }
}
