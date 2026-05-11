import { NutritionalRiskLevel } from './nutritional-risk-level.enum';

/**
 * Immutable Value Object representing a complete macronutrient snapshot.
 *
 * Encapsulates the six key nutritional figures (calories, protein, carbs,
 * fat, fiber, sugar) and provides domain-level operations such as addition
 * and proportional scaling — keeping calculation logic out of services and views.
 *
 * @author Mora Rivera, Joel Fernando
 */
export class MacronutrientDistribution {
  readonly calories: number;
  readonly protein:  number;
  readonly carbs:    number;
  readonly fat:      number;
  readonly fiber:    number;
  readonly sugar:    number;

  constructor(props: {
    calories: number; protein: number; carbs: number;
    fat: number; fiber: number; sugar: number;
  }) {
    this.calories = props.calories;
    this.protein  = props.protein;
    this.carbs    = props.carbs;
    this.fat      = props.fat;
    this.fiber    = props.fiber;
    this.sugar    = props.sugar;
  }

  /** Returns a new distribution with values summed and rounded to 1 decimal place. */
  add(other: MacronutrientDistribution): MacronutrientDistribution {
    const r = (v: number) => Math.round(v * 10) / 10;
    return new MacronutrientDistribution({
      calories: r(this.calories + other.calories),
      protein:  r(this.protein  + other.protein),
      carbs:    r(this.carbs    + other.carbs),
      fat:      r(this.fat      + other.fat),
      fiber:    r(this.fiber    + other.fiber),
      sugar:    r(this.sugar    + other.sugar),
    });
  }

  /** Returns a new distribution scaled proportionally by the given ratio. */
  scale(ratio: number): MacronutrientDistribution {
    const r = (v: number) => Math.round(v * ratio * 10) / 10;
    return new MacronutrientDistribution({
      calories: r(this.calories),
      protein:  r(this.protein),
      carbs:    r(this.carbs),
      fat:      r(this.fat),
      fiber:    r(this.fiber),
      sugar:    r(this.sugar),
    });
  }

  /**
   * Classifies the caloric risk of this distribution in context.
   *
   * HIGH     — combined total meets or exceeds the daily goal.
   * MODERATE — combined total reaches ≥ 80 % of the goal.
   * SAFE     — combined total stays below 80 %.
   *
   * @param dailyGoal      - User's daily calorie target.
   * @param alreadyConsumed - Calories already logged for the day.
   */
  classifyRisk(dailyGoal: number, alreadyConsumed: number): NutritionalRiskLevel {
    if (dailyGoal <= 0) return NutritionalRiskLevel.SAFE;
    const ratio = (alreadyConsumed + this.calories) / dailyGoal;
    if (ratio >= 1.0) return NutritionalRiskLevel.HIGH;
    if (ratio >= 0.8) return NutritionalRiskLevel.MODERATE;
    return NutritionalRiskLevel.SAFE;
  }

  /** Zero-value distribution — identity element for {@link add}. */
  static zero(): MacronutrientDistribution {
    return new MacronutrientDistribution({ calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0 });
  }
}
