import { ActivityLevel } from './activity-level.enum';
import { UserGoal } from './user-goal.enum';

/**
 * Snapshot of computed daily macro targets.
 *
 * Immutable: every field is readonly and instances are produced only through
 * {@link MetabolicTargets.calculate}. Kept in the IAM domain temporarily;
 * ownership will transfer to the MetabolicAdaptation context once it
 * subscribes to {@link OnboardingCompleted} and publishes `MetabolicTargetSet`.
 */
export class MetabolicTargets {
  /** Daily calorie target in kcal. */
  readonly dailyCalorieTarget: number;
  /** Daily protein target in grams. */
  readonly proteinTarget: number;
  /** Daily carbohydrate target in grams. */
  readonly carbsTarget: number;
  /** Daily fat target in grams. */
  readonly fatTarget: number;
  /** Daily dietary fibre target in grams (fixed at 25 g). */
  readonly fiberTarget: number;
  /** Basal Metabolic Rate in kcal used during this calculation. */
  readonly bmr: number;
  /** Total Daily Energy Expenditure in kcal before goal offset. */
  readonly tdee: number;

  private constructor(data: {
    dailyCalorieTarget: number;
    proteinTarget: number;
    carbsTarget: number;
    fatTarget: number;
    fiberTarget: number;
    bmr: number;
    tdee: number;
  }) {
    this.dailyCalorieTarget = data.dailyCalorieTarget;
    this.proteinTarget = data.proteinTarget;
    this.carbsTarget = data.carbsTarget;
    this.fatTarget = data.fatTarget;
    this.fiberTarget = data.fiberTarget;
    this.bmr = data.bmr;
    this.tdee = data.tdee;
  }

  /**
   * Calculates daily macro targets.
   *
   * When `leanMassKg` is provided (body composition known), uses the
   * **Katch-McArdle** formula: BMR = 370 + 21.6 × lean_mass_kg.
   * Otherwise falls back to **Mifflin-St Jeor**: BMR = 10w + 6.25h − 161.
   *
   * Steps:
   * 1. BMR — Katch-McArdle if lean mass available, otherwise Mifflin-St Jeor
   * 2. TDEE = BMR × activity multiplier (1.2 / 1.375 / 1.55 / 1.725)
   * 3. Calories = TDEE − 300 (weight loss) or TDEE + 300 (muscle gain)
   * 4. Protein — based on lean mass when available (2.4 g/kg MUSCLE_GAIN,
   *    2.0 g/kg WEIGHT_LOSS), otherwise total weight (2.0 g/kg / 1.6 g/kg)
   * 5. Fat = 25 % of calories ÷ 9
   * 6. Carbs = (calories − protein kcal − fat kcal) ÷ 4
   * 7. Fibre = 25 g fixed
   *
   * @param weightKg      - Body weight in kilograms.
   * @param heightCm      - Height in centimetres.
   * @param activityLevel - Daily activity level.
   * @param goal          - Fitness goal driving the caloric offset.
   * @param leanMassKg    - Optional lean body mass (kg) from body composition measurement.
   * @returns An immutable {@link MetabolicTargets} instance.
   */
  static calculate(
    weightKg: number,
    heightCm: number,
    activityLevel: ActivityLevel,
    goal: UserGoal,
    leanMassKg?: number,
  ): MetabolicTargets {
    const bmr = leanMassKg !== undefined
      ? 370 + 21.6 * leanMassKg
      : 10 * weightKg + 6.25 * heightCm - 161;

    const multipliers: Record<ActivityLevel, number> = {
      [ActivityLevel.SEDENTARY]: 1.2,
      [ActivityLevel.MODERATE]: 1.375,
      [ActivityLevel.ACTIVE]: 1.55,
      [ActivityLevel.VERY_ACTIVE]: 1.725,
    };
    const tdee = bmr * multipliers[activityLevel];

    const calories =
      goal === UserGoal.WEIGHT_LOSS ? Math.round(tdee - 300) : Math.round(tdee + 300);

    const base = leanMassKg ?? weightKg;
    const protein =
      goal === UserGoal.WEIGHT_LOSS
        ? Math.round(base * (leanMassKg !== undefined ? 2.0 : 1.6))
        : Math.round(base * (leanMassKg !== undefined ? 2.4 : 2.0));

    const fat = Math.round((calories * 0.25) / 9);
    const carbs = Math.round((calories - protein * 4 - fat * 9) / 4);

    return new MetabolicTargets({
      dailyCalorieTarget: calories,
      proteinTarget: protein,
      carbsTarget: Math.max(carbs, 0),
      fatTarget: fat,
      fiberTarget: 25,
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
    });
  }

  /**
   * Produces a new {@link MetabolicTargets} by adding an activity-trend
   * adjustment on top of an existing set of targets.
   *
   * Extra calories are allocated entirely to carbohydrates (primary fuel for
   * aerobic activity). Protein, fat and fibre remain unchanged.
   *
   * @param base             - Existing targets to adjust.
   * @param extraKcalPerDay  - Daily calorie increment derived from the activity trend.
   * @returns A new immutable {@link MetabolicTargets} instance.
   */
  static withActivityAdjustment(
    base: MetabolicTargets,
    extraKcalPerDay: number,
  ): MetabolicTargets {
    const extraCarbs = Math.round(extraKcalPerDay / 4);
    return new MetabolicTargets({
      dailyCalorieTarget: base.dailyCalorieTarget + extraKcalPerDay,
      proteinTarget:      base.proteinTarget,
      carbsTarget:        base.carbsTarget + extraCarbs,
      fatTarget:          base.fatTarget,
      fiberTarget:        base.fiberTarget,
      bmr:                base.bmr,
      tdee:               base.tdee,
    });
  }
}
