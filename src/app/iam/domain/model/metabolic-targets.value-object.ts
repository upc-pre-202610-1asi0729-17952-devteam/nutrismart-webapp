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

  private constructor(data: {
    dailyCalorieTarget: number;
    proteinTarget: number;
    carbsTarget: number;
    fatTarget: number;
    fiberTarget: number;
  }) {
    this.dailyCalorieTarget = data.dailyCalorieTarget;
    this.proteinTarget = data.proteinTarget;
    this.carbsTarget = data.carbsTarget;
    this.fatTarget = data.fatTarget;
    this.fiberTarget = data.fiberTarget;
  }

  /**
   * Calculates daily macro targets using the Mifflin-St Jeor formula.
   *
   * Steps:
   * 1. BMR (female formula) = (10 × weight) + (6.25 × height) − 161
   * 2. TDEE = BMR × activity multiplier (1.2 / 1.375 / 1.55 / 1.725)
   * 3. Calories = TDEE − 300 (weight loss) or TDEE + 300 (muscle gain)
   * 4. Protein = weight × 1.6 g (weight loss) or weight × 2.0 g (muscle gain)
   * 5. Fat = 25 % of calories ÷ 9
   * 6. Carbs = (calories − protein kcal − fat kcal) ÷ 4
   * 7. Fibre = 25 g fixed
   *
   * @param weightKg      - Body weight in kilograms.
   * @param heightCm      - Height in centimetres.
   * @param activityLevel - Daily activity level.
   * @param goal          - Fitness goal driving the caloric offset.
   * @returns An immutable {@link MetabolicTargets} instance.
   */
  static calculate(
    weightKg: number,
    heightCm: number,
    activityLevel: ActivityLevel,
    goal: UserGoal,
  ): MetabolicTargets {
    const bmr = 10 * weightKg + 6.25 * heightCm - 161;

    const multipliers: Record<ActivityLevel, number> = {
      [ActivityLevel.SEDENTARY]: 1.2,
      [ActivityLevel.MODERATE]: 1.375,
      [ActivityLevel.ACTIVE]: 1.55,
      [ActivityLevel.VERY_ACTIVE]: 1.725,
    };
    const tdee = bmr * multipliers[activityLevel];

    const calories =
      goal === UserGoal.WEIGHT_LOSS ? Math.round(tdee - 300) : Math.round(tdee + 300);

    const protein =
      goal === UserGoal.WEIGHT_LOSS
        ? Math.round(weightKg * 1.6)
        : Math.round(weightKg * 2.0);

    const fat = Math.round((calories * 0.25) / 9);
    const carbs = Math.round((calories - protein * 4 - fat * 9) / 4);

    return new MetabolicTargets({
      dailyCalorieTarget: calories,
      proteinTarget: protein,
      carbsTarget: carbs,
      fatTarget: fat,
      fiberTarget: 25,
    });
  }
}
