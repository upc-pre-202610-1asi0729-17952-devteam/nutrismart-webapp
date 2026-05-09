import { BaseEntity } from '../../../shared/infrastructure/base-entity';
import { ActivityLevel } from './activity-level.enum';
import { DietaryRestriction } from './dietary-restriction.enum';
import { SubscriptionPlan } from './subscription-plan.enum';
import { UserGoal } from './user-goal.enum';

/**
 * Constructor data transfer object for creating a {@link User} instance.
 */
export interface UserProps {
  /** Unique numeric identifier assigned by the backend. */
  id: number;
  /** User's given name. */
  firstName: string;
  /** User's family name. */
  lastName: string;
  /** User's email address. */
  email: string;
  /** Primary fitness goal. */
  goal: UserGoal;
  /** Body weight in kilograms. */
  weight: number;
  /** Height in centimetres. */
  height: number;
  /** Daily physical activity level. */
  activityLevel: ActivityLevel;
  /** Current subscription tier. Null when no plan has been chosen yet. */
  plan: SubscriptionPlan | null;
  /** Active dietary restrictions. */
  restrictions: DietaryRestriction[];
  /** Free-text medical conditions relevant to diet. */
  medicalConditions: string[];
  /** Daily calorie target in kcal derived from TDEE. */
  dailyCalorieTarget: number;
  /** Daily protein target in grams. */
  proteinTarget: number;
  /** Daily carbohydrates target in grams. */
  carbsTarget: number;
  /** Daily fat target in grams. */
  fatTarget: number;
  /** Daily dietary fibre target in grams. */
  fiberTarget: number;
  /** Number of consecutive days with on-track nutrition logging. */
  streak: number;
  /** Number of consecutive days where logs were missed. */
  consecutiveMisses: number;
  /** Date of birth in ISO format (YYYY-MM-DD). Optional. */
  birthday?: string;
  /** Biological sex: 'male' | 'female' | 'other'. Optional. */
  biologicalSex?: string;
}

/**
 * Domain entity representing an authenticated NutriSmart user.
 *
 * Non-anemic: encapsulates business rules such as macro recalculation,
 * restriction management, and subscription-tier checks alongside its data.
 * Always create instances via the constructor rather than plain object literals.
 */
export class User implements BaseEntity {
  /** @see UserProps.id */
  private _id: number;
  /** @see UserProps.firstName */
  private _firstName: string;
  /** @see UserProps.lastName */
  private _lastName: string;
  /** @see UserProps.email */
  private _email: string;
  /** @see UserProps.goal */
  private _goal: UserGoal;
  /** @see UserProps.weight */
  private _weight: number;
  /** @see UserProps.height */
  private _height: number;
  /** @see UserProps.activityLevel */
  private _activityLevel: ActivityLevel;
  /** @see UserProps.plan */
  private _plan: SubscriptionPlan | null;
  /** @see UserProps.restrictions */
  private _restrictions: DietaryRestriction[];
  /** @see UserProps.medicalConditions */
  private _medicalConditions: string[];
  /** @see UserProps.dailyCalorieTarget */
  private _dailyCalorieTarget: number;
  /** @see UserProps.proteinTarget */
  private _proteinTarget: number;
  /** @see UserProps.carbsTarget */
  private _carbsTarget: number;
  /** @see UserProps.fatTarget */
  private _fatTarget: number;
  /** @see UserProps.fiberTarget */
  private _fiberTarget: number;
  /** @see UserProps.streak */
  private _streak: number;
  /** @see UserProps.consecutiveMisses */
  private _consecutiveMisses: number;
  /** @see UserProps.birthday */
  private _birthday: string;
  /** @see UserProps.biologicalSex */
  private _biologicalSex: string;

  /**
   * Creates a new User domain entity.
   *
   * @param props - All data required to initialise the entity.
   */
  constructor(props: UserProps) {
    this._id = props.id;
    this._firstName = props.firstName;
    this._lastName = props.lastName;
    this._email = props.email;
    this._goal = props.goal;
    this._weight = props.weight;
    this._height = props.height;
    this._activityLevel = props.activityLevel;
    this._plan = props.plan;
    this._restrictions = [...props.restrictions];
    this._medicalConditions = [...props.medicalConditions];
    this._dailyCalorieTarget = props.dailyCalorieTarget;
    this._proteinTarget = props.proteinTarget;
    this._carbsTarget = props.carbsTarget;
    this._fatTarget = props.fatTarget;
    this._fiberTarget = props.fiberTarget;
    this._streak = props.streak;
    this._consecutiveMisses = props.consecutiveMisses;
    this._birthday = props.birthday ?? '';
    this._biologicalSex = props.biologicalSex ?? '';
  }

  // ─── Getters & Setters ────────────────────────────────────────────────────

  /** Unique numeric identifier assigned by the backend. */
  get id(): number {
    return this._id;
  }
  /** @param value - New identifier value. */
  set id(value: number) {
    this._id = value;
  }

  /** User's given name. */
  get firstName(): string {
    return this._firstName;
  }
  /** @param value - New given name. */
  set firstName(value: string) {
    this._firstName = value;
  }

  /** User's family name. */
  get lastName(): string {
    return this._lastName;
  }
  /** @param value - New family name. */
  set lastName(value: string) {
    this._lastName = value;
  }

  /** User's email address. */
  get email(): string {
    return this._email;
  }
  /** @param value - New email address. */
  set email(value: string) {
    this._email = value;
  }

  /** Primary fitness goal driving macro calculations. */
  get goal(): UserGoal {
    return this._goal;
  }
  /** @param value - New fitness goal. */
  set goal(value: UserGoal) {
    this._goal = value;
  }

  /** Body weight in kilograms. */
  get weight(): number {
    return this._weight;
  }
  /** @param value - New weight in kg. */
  set weight(value: number) {
    this._weight = value;
  }

  /** Height in centimetres. */
  get height(): number {
    return this._height;
  }
  /** @param value - New height in cm. */
  set height(value: number) {
    this._height = value;
  }

  /** Physical activity level used in TDEE calculation. */
  get activityLevel(): ActivityLevel {
    return this._activityLevel;
  }
  /** @param value - New activity level. */
  set activityLevel(value: ActivityLevel) {
    this._activityLevel = value;
  }

  /** Current subscription tier. Null when no plan has been chosen yet. */
  get plan(): SubscriptionPlan | null {
    return this._plan;
  }
  /** @param value - New subscription plan. */
  set plan(value: SubscriptionPlan | null) {
    this._plan = value;
  }

  /** Active dietary restrictions. Returns a copy of the internal array. */
  get restrictions(): DietaryRestriction[] {
    return [...this._restrictions];
  }
  /** @param value - Replacement restrictions array. */
  set restrictions(value: DietaryRestriction[]) {
    this._restrictions = [...value];
  }

  /** Free-text medical conditions relevant to diet. Returns a copy. */
  get medicalConditions(): string[] {
    return [...this._medicalConditions];
  }
  /** @param value - Replacement medical conditions array. */
  set medicalConditions(value: string[]) {
    this._medicalConditions = [...value];
  }

  /** Daily calorie target in kcal. */
  get dailyCalorieTarget(): number {
    return this._dailyCalorieTarget;
  }
  /** @param value - New calorie target. */
  set dailyCalorieTarget(value: number) {
    this._dailyCalorieTarget = value;
  }

  /** Daily protein target in grams. */
  get proteinTarget(): number {
    return this._proteinTarget;
  }
  /** @param value - New protein target. */
  set proteinTarget(value: number) {
    this._proteinTarget = value;
  }

  /** Daily carbohydrate target in grams. */
  get carbsTarget(): number {
    return this._carbsTarget;
  }
  /** @param value - New carbs target. */
  set carbsTarget(value: number) {
    this._carbsTarget = value;
  }

  /** Daily fat target in grams. */
  get fatTarget(): number {
    return this._fatTarget;
  }
  /** @param value - New fat target. */
  set fatTarget(value: number) {
    this._fatTarget = value;
  }

  /** Daily dietary fibre target in grams. */
  get fiberTarget(): number {
    return this._fiberTarget;
  }
  /** @param value - New fiber target. */
  set fiberTarget(value: number) {
    this._fiberTarget = value;
  }

  /** Consecutive days with on-track logging. */
  get streak(): number {
    return this._streak;
  }
  /** @param value - New streak value. */
  set streak(value: number) {
    this._streak = value;
  }

  /** Consecutive days where logs were missed. */
  get consecutiveMisses(): number {
    return this._consecutiveMisses;
  }
  /** @param value - New consecutiveMisses value. */
  set consecutiveMisses(value: number) {
    this._consecutiveMisses = value;
  }

  /** Date of birth in ISO format (YYYY-MM-DD). */
  get birthday(): string {
    return this._birthday;
  }
  /** @param value - New birthday value. */
  set birthday(value: string) {
    this._birthday = value;
  }

  /** Biological sex string. */
  get biologicalSex(): string {
    return this._biologicalSex;
  }
  /** @param value - New biologicalSex value. */
  set biologicalSex(value: string) {
    this._biologicalSex = value;
  }

  // ─── Computed / Behaviour Methods ─────────────────────────────────────────

  /**
   * Full display name combining first and last name.
   *
   * @returns "{firstName} {lastName}"
   */
  get fullName(): string {
    return `${this._firstName} ${this._lastName}`;
  }

  /**
   * Avatar initials derived from the first letter of each name part.
   *
   * @returns Upper-cased initials, e.g. "AG" for "Ana García".
   */
  get initials(): string {
    return `${this._firstName.charAt(0)}${this._lastName.charAt(0)}`.toUpperCase();
  }

  /**
   * Body Mass Index calculated from weight and height.
   *
   * Formula: weight (kg) / (height (m))^2, rounded to one decimal place.
   *
   * @returns BMI value rounded to 1 decimal place.
   */
  get bmi(): number {
    const heightM = this._height / 100;
    return Math.round((this._weight / (heightM * heightM)) * 10) / 10;
  }

  /**
   * Determines whether the user has an active paid subscription.
   *
   * @returns `true` if the user is on PRO or PREMIUM; `false` for BASIC.
   */
  isPro(): boolean {
    return this._plan === SubscriptionPlan.PRO || this._plan === SubscriptionPlan.PREMIUM;
  }

  /**
   * Determines whether the user can upgrade their subscription tier.
   *
   * @returns `true` if the user has no plan yet or is not already on PREMIUM.
   */
  canUpgrade(): boolean {
    return this._plan !== SubscriptionPlan.PREMIUM;
  }

  /**
   * Checks whether the user has a specific dietary restriction active.
   *
   * @param r - The restriction to check.
   * @returns `true` if the restriction is currently active.
   */
  hasRestriction(r: DietaryRestriction): boolean {
    return this._restrictions.includes(r);
  }

  /**
   * Adds a dietary restriction if it is not already present.
   *
   * @param r - The restriction to add.
   */
  addRestriction(r: DietaryRestriction): void {
    if (!this.hasRestriction(r)) {
      this._restrictions.push(r);
    }
  }

  /**
   * Removes a dietary restriction from the active list.
   *
   * @param r - The restriction to remove.
   */
  removeRestriction(r: DietaryRestriction): void {
    this._restrictions = this._restrictions.filter((x) => x !== r);
  }

  /**
   * Adds a medical condition if it is not already present.
   *
   * @param c - The medical condition description to add.
   */
  addMedicalCondition(c: string): void {
    if (!this._medicalConditions.includes(c)) {
      this._medicalConditions.push(c);
    }
  }

  /**
   * Removes a medical condition from the active list.
   *
   * @param c - The medical condition description to remove.
   */
  removeMedicalCondition(c: string): void {
    this._medicalConditions = this._medicalConditions.filter((x) => x !== c);
  }

  /**
   * Recalculates daily macro targets using the Mifflin-St Jeor formula.
   *
   * Steps:
   * 1. BMR (female formula) = (10 × weight) + (6.25 × height) − 161
   * 2. TDEE = BMR × activityMultiplier (1.2 / 1.375 / 1.55 / 1.725)
   * 3. Calories = TDEE − 300 for WEIGHT_LOSS, TDEE + 300 for MUSCLE_GAIN
   * 4. Protein = weight × 1.6 g (WEIGHT_LOSS) or weight × 2.0 g (MUSCLE_GAIN)
   * 5. Fat = 25 % of calories ÷ 9
   * 6. Carbs = (calories − proteinCals − fatCals) ÷ 4
   * 7. Fiber = 25 g fixed
   *
   * Results are rounded to the nearest integer and stored on the entity.
   */
  recalculateMacros(): void {
    const bmr = 10 * this._weight + 6.25 * this._height - 161;

    const multipliers: Record<ActivityLevel, number> = {
      [ActivityLevel.SEDENTARY]: 1.2,
      [ActivityLevel.MODERATE]: 1.375,
      [ActivityLevel.ACTIVE]: 1.55,
      [ActivityLevel.VERY_ACTIVE]: 1.725,
    };
    const tdee = bmr * multipliers[this._activityLevel];

    const calories =
      this._goal === UserGoal.WEIGHT_LOSS ? Math.round(tdee - 300) : Math.round(tdee + 300);

    const protein =
      this._goal === UserGoal.WEIGHT_LOSS
        ? Math.round(this._weight * 1.6)
        : Math.round(this._weight * 2.0);

    const fat = Math.round((calories * 0.25) / 9);
    const proteinCals = protein * 4;
    const fatCals = fat * 9;
    const carbs = Math.round((calories - proteinCals - fatCals) / 4);

    this._dailyCalorieTarget = calories;
    this._proteinTarget = protein;
    this._fatTarget = fat;
    this._carbsTarget = carbs;
    this._fiberTarget = 25;
  }

  /**
   * Returns a compact summary string of the daily nutrition targets.
   *
   * @returns A formatted string like "1800 kcal | P:112g C:195g F:50g".
   */
  dailySummary(): string {
    return `${this._dailyCalorieTarget} kcal | P:${this._proteinTarget}g C:${this._carbsTarget}g F:${this._fatTarget}g`;
  }
}
