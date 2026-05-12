import { BaseEntity } from '../../../shared/infrastructure/base-entity';
import { WearableStatus } from './wearable-status.enum';

export interface WearableConnectionProps {
  id: number;
  userId: number | string;
  provider: string;
  status: WearableStatus;
  lastSyncedAt: string;
  authorizedAt: string;
}

/**
 * Domain entity representing a user's wearable device connection.
 *
 * Non-anemic: encapsulates health-check logic and sync-age calculation
 * so presentation never reasons about raw timestamps or status strings.
 */
export class WearableConnection implements BaseEntity {
  #id: number;
  #userId: number | string;
  #provider: string;
  #status: WearableStatus;
  #lastSyncedAt: string;
  #authorizedAt: string;

  constructor(props: WearableConnectionProps) {
    this.#id           = props.id;
    this.#userId       = props.userId;
    this.#provider     = props.provider;
    this.#status       = props.status;
    this.#lastSyncedAt = props.lastSyncedAt;
    this.#authorizedAt = props.authorizedAt;
  }

  get id(): number { return this.#id; }
  set id(v: number) { this.#id = v; }

  get userId(): number | string { return this.#userId; }
  get provider(): string { return this.#provider; }

  get status(): WearableStatus { return this.#status; }
  set status(v: WearableStatus) { this.#status = v; }

  get lastSyncedAt(): string { return this.#lastSyncedAt; }
  set lastSyncedAt(v: string) { this.#lastSyncedAt = v; }

  get authorizedAt(): string { return this.#authorizedAt; }

  isHealthy(): boolean {
    return this.#status === WearableStatus.CONNECTED;
  }

  minutesSinceSync(now: Date = new Date()): number {
    if (!this.#lastSyncedAt) return Infinity;
    return Math.floor((now.getTime() - new Date(this.#lastSyncedAt).getTime()) / 60_000);
  }

  hoursSinceSync(now: Date = new Date()): number {
    return Math.floor(this.minutesSinceSync(now) / 60);
  }
}
