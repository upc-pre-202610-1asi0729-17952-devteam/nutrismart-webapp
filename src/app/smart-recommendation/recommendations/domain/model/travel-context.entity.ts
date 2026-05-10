import { BaseEntity } from '../../../../shared/infrastructure/base-entity';

/**
 * Constructor DTO for creating a {@link TravelContext} instance.
 *
 * @author Espinoza Cruz, Angela Milagros
 */
export interface TravelContextProps {
  /** Unique numeric identifier. */
  id: number;
  /** Detected or manually entered travel city. */
  city: string;
  /** Country of the travel city. */
  country: string;
  /** Whether travel mode is currently active. */
  isActive: boolean;
  /** Whether the city was entered manually rather than auto-detected. */
  isManual: boolean;
  /** ISO timestamp when travel mode was activated. */
  activatedAt: string;
}

/**
 * Domain entity representing the user's travel-mode context.
 *
 * Non-anemic: exposes domain behaviour methods {@link isTravelActive},
 * {@link hasManualCity}, and {@link locationLabel} to encapsulate
 * travel-state rules away from the presentation layer.
 *
 * @author Espinoza Cruz, Angela Milagros
 */
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

  // ─── Getters & Setters ────────────────────────────────────────────────────

  /** Unique numeric identifier. */
  get id(): number { return this.#id; }
  set id(v: number) { this.#id = v; }

  /** Travel city name. */
  get city(): string { return this.#city; }
  set city(v: string) { this.#city = v; }

  /** Travel country name. */
  get country(): string { return this.#country; }
  set country(v: string) { this.#country = v; }

  /** Whether travel mode is active. */
  get isActive(): boolean { return this.#isActive; }
  set isActive(v: boolean) { this.#isActive = v; }

  /** Whether the city was entered manually. */
  get isManual(): boolean { return this.#isManual; }
  set isManual(v: boolean) { this.#isManual = v; }

  /** ISO timestamp of activation. */
  get activatedAt(): string { return this.#activatedAt; }
  set activatedAt(v: string) { this.#activatedAt = v; }

  // ─── Domain Behaviour ─────────────────────────────────────────────────────

  /**
   * Returns `true` when travel mode is active and a city has been set.
   * Drives which recommendation card set is shown in the view.
   */
  isTravelActive(): boolean {
    return this.#isActive && this.#city.trim().length > 0;
  }

  /**
   * Returns `true` when the travel city was entered manually by the user
   * (as opposed to being auto-detected by geolocation).
   */
  hasManualCity(): boolean {
    return this.#isManual;
  }

  /**
   * Returns a formatted location label including city and country.
   * Used in banner headers and badges (e.g. "Cusco, Peru").
   */
  locationLabel(): string {
    return `${this.#city}, ${this.#country}`;
  }

  /** Activates travel mode for the given city and country. */
  activate(city: string, country: string, manual: boolean): void {
    this.#city        = city;
    this.#country     = country;
    this.#isActive    = true;
    this.#isManual    = manual;
    this.#activatedAt = new Date().toISOString();
  }

  /** Deactivates travel mode and clears city data. */
  deactivate(): void {
    this.#isActive = false;
    this.#city     = '';
    this.#country  = '';
  }
}
