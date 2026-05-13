const MET_VALUES: Readonly<Record<string, number>> = {
  running:         8.0,
  cycling:         7.5,
  swimming:        8.3,
  walking:         3.5,
  weight_training: 5.0,
  hiit:            8.0,
  yoga:            2.5,
  elliptical:      5.0,
  rowing:          7.0,
  boxing:          7.8,
  pilates:         3.0,
  dancing:         4.8,
  basketball:      6.5,
  football:        7.0,
  tennis:          7.3,
  volleyball:      4.0,
  hiking:          5.3,
  jump_rope:       10.0,
  stair_climbing:  9.0,
  stretching:      2.3,
  crossfit:        8.5,
  martial_arts:    7.0,
};

/**
 * Immutable value object representing a type of physical activity.
 *
 * Encapsulates the MET (Metabolic Equivalent of Task) value for the activity
 * and provides the canonical calorie-estimation formula used in the domain:
 * calories = MET × weight_kg × (duration_min / 60)
 */
export class ActivityType {
  private constructor(
    private readonly _key: string,
    private readonly _metValue: number,
  ) {}

  static from(key: string): ActivityType {
    const met = MET_VALUES[key];
    if (met === undefined) throw new Error(`Unknown activity type: ${key}`);
    return new ActivityType(key, met);
  }

  get key(): string { return this._key; }
  get metValue(): number { return this._metValue; }

  estimateCalories(weightKg: number, durationMinutes: number): number {
    return Math.round(this._metValue * weightKg * (durationMinutes / 60));
  }

  static allKeys(): string[] {
    return Object.keys(MET_VALUES);
  }

  static metFor(key: string): number {
    return MET_VALUES[key] ?? 0;
  }
}
