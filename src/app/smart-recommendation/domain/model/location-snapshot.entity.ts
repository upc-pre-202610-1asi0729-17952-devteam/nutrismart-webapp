import { BaseEntity } from '../../../shared/infrastructure/base-entity';

export interface LocationSnapshotProps {
  id: number;
  userId: number;
  city: string;
  country: string;
  recordedAt: string;
}

export class LocationSnapshot implements BaseEntity {
  #id: number;
  #userId: number;
  #city: string;
  #country: string;
  #recordedAt: string;

  constructor(props: LocationSnapshotProps) {
    this.#id         = props.id;
    this.#userId     = props.userId;
    this.#city       = props.city;
    this.#country    = props.country;
    this.#recordedAt = props.recordedAt;
  }

  get id(): number { return this.#id; }
  set id(v: number) { this.#id = v; }

  get userId(): number { return this.#userId; }
  set userId(v: number) { this.#userId = v; }

  get city(): string { return this.#city; }
  set city(v: string) { this.#city = v; }

  get country(): string { return this.#country; }
  set country(v: string) { this.#country = v; }

  get recordedAt(): string { return this.#recordedAt; }
  set recordedAt(v: string) { this.#recordedAt = v; }

  // ─── Domain Behaviour ─────────────────────────────────────────────────────

  isHome(homeCity: string): boolean {
    return this.#city.trim().toLowerCase() === homeCity.trim().toLowerCase();
  }
}
