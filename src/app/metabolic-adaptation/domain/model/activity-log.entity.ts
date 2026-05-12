import { BaseEntity } from '../../../shared/infrastructure/base-entity';

export interface ActivityLogProps {
  id: number;
  userId: number;
  activityType: string;
  durationMinutes: number;
  caloriesBurned: number;
  timestamp: string;
}

/**
 * Domain entity representing a single logged physical activity session.
 *
 * Non-anemic: exposes `toNetAdjustment()` so callers never manipulate
 * the raw `caloriesBurned` value directly when building the daily balance.
 */
export class ActivityLog implements BaseEntity {
  #id: number;
  #userId: number | string;
  #activityType: string;
  #durationMinutes: number;
  #caloriesBurned: number;
  #timestamp: string;

  constructor(props: ActivityLogProps) {
    this.#id              = props.id;
    this.#userId          = props.userId;
    this.#activityType    = props.activityType;
    this.#durationMinutes = props.durationMinutes;
    this.#caloriesBurned  = props.caloriesBurned;
    this.#timestamp       = props.timestamp;
  }

  get id(): number { return this.#id; }
  set id(v: number) { this.#id = v; }

  get userId(): number { return this.#userId; }
  get activityType(): string { return this.#activityType; }
  get durationMinutes(): number { return this.#durationMinutes; }
  get caloriesBurned(): number { return this.#caloriesBurned; }
  get timestamp(): string { return this.#timestamp; }

  /** Returns the positive calorie adjustment this log adds to the daily net target. */
  toNetAdjustment(): number {
    return this.#caloriesBurned;
  }

  isFromToday(now: Date = new Date()): boolean {
    const d = new Date(this.#timestamp);
    return d.getFullYear() === now.getFullYear()
      && d.getMonth() === now.getMonth()
      && d.getDate() === now.getDate();
  }
}
