import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';

/**
 * Validates that the date entered corresponds to a person at least `minAge`
 * years old. Assumes the control value is an ISO date string (YYYY-MM-DD).
 *
 * @param minAge - Minimum age in full years required.
 */
function minAgeValidator(minAge: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value: string = control.value;
    if (!value) return null; // handled by Validators.required
    const birth = new Date(value);
    if (isNaN(birth.getTime())) return { invalidDate: true };
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age < minAge ? { minAge: { required: minAge, actual: age } } : null;
  };
}
import { TranslatePipe } from '@ngx-translate/core';
import { LanguageSwitcher } from '../../../../shared/presentation/components/language-switcher/language-switcher';
import { IamStore } from '../../../../iam/application/iam.store';
import { ActivityLevel } from '../../../../iam/domain/model/activity-level.enum';
import { DietaryRestriction } from '../../../../iam/domain/model/dietary-restriction.enum';
import { MedicalCondition } from '../../../../iam/domain/model/medical-condition.enum';
import { UserGoal } from '../../../../iam/domain/model/user-goal.enum';

/**
 * Represents one selectable activity level card in step 1.
 */
interface ActivityCard {
  /** The {@link ActivityLevel} value this card represents. */
  level: ActivityLevel;
  /** i18n key for the label. */
  labelKey: string;
  /** i18n key for the short description. */
  descKey: string;
}

/**
 * Represents a dietary restriction toggle chip in step 3.
 */
interface RestrictionChip {
  /** The {@link DietaryRestriction} enum value. */
  value: DietaryRestriction;
  /** i18n key for the chip label. */
  labelKey: string;
}

/**
 * Represents a medical condition toggle chip in step 3.
 */
interface ConditionChip {
  /** The {@link MedicalCondition} enum value. */
  value: MedicalCondition;
  /** i18n key for the chip label. */
  labelKey: string;
}

/**
 * Multi-step onboarding wizard component.
 *
 * Guides new users through 4 steps to personalise their NutriSmart experience:
 * 1. About you + Body (birthday, biological sex, weight, height, activity level)
 * 2. Your goal (weight loss vs. muscle gain)
 * 3. Dietary restrictions & Medical conditions
 * 4. Summary with calculated macros
 *
 * State is managed with Angular signals; the {@link IamStore} is updated at
 * the appropriate steps. At step 4 the user is directed to `/subscription`.
 */
@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe, LanguageSwitcher],
  templateUrl: './onboarding.html',
  styleUrl: './onboarding.css',
})
export class Onboarding {
  /** IAM store for reading and updating user state. */
  iamStore = inject(IamStore);

  /** Angular router for post-onboarding navigation. */
  private router = inject(Router);

  /** Form builder used to construct step-specific reactive forms. */
  private fb = inject(FormBuilder);

  /** Total number of steps in the onboarding flow. */
  readonly totalSteps = 4;

  /**
   * Current step number (1–4). Controls which step content is rendered.
   */
  currentStep = signal(1);

  /**
   * Selected activity level in step 1. Defaults to MODERATE.
   */
  selectedActivity = signal<ActivityLevel>(ActivityLevel.MODERATE);

  /**
   * Selected fitness goal in step 2. Defaults to WEIGHT_LOSS.
   */
  selectedGoal = signal<UserGoal>(UserGoal.WEIGHT_LOSS);

  /**
   * Set of dietary restrictions selected in step 3.
   */
  selectedRestrictions = signal<Set<DietaryRestriction>>(new Set());

  /**
   * Set of medical conditions selected in step 3.
   */
  selectedConditions = signal<Set<MedicalCondition>>(new Set());

  // ─── Step forms ───────────────────────────────────────────────────────────

  /**
   * Step 1 reactive form (body stats + demographics).
   */
  bodyForm = this.fb.group({
    birthday: ['', [Validators.required, minAgeValidator(13)]],
    biologicalSex: ['', Validators.required],
    weight: [null as number | null, [Validators.required, Validators.min(30), Validators.max(300)]],
    height: [
      null as number | null,
      [Validators.required, Validators.min(100), Validators.max(250)],
    ],
  });

  // ─── Static data ──────────────────────────────────────────────────────────

  /**
   * Activity level cards displayed in step 1.
   */
  readonly activityCards: ActivityCard[] = [
    {
      level: ActivityLevel.SEDENTARY,
      labelKey: 'onboarding.sedentary',
      descKey: 'onboarding.sedentary_desc',
    },
    {
      level: ActivityLevel.MODERATE,
      labelKey: 'onboarding.moderate',
      descKey: 'onboarding.moderate_desc',
    },
    {
      level: ActivityLevel.ACTIVE,
      labelKey: 'onboarding.active',
      descKey: 'onboarding.active_desc',
    },
    {
      level: ActivityLevel.VERY_ACTIVE,
      labelKey: 'onboarding.very_active',
      descKey: 'onboarding.very_active_desc',
    },
  ];

  /**
   * Restriction chips displayed in step 3.
   */
  readonly restrictionChips: RestrictionChip[] = [
    { value: DietaryRestriction.LACTOSE_FREE, labelKey: 'restrictions.LACTOSE_FREE' },
    { value: DietaryRestriction.GLUTEN_FREE, labelKey: 'restrictions.GLUTEN_FREE' },
    { value: DietaryRestriction.VEGAN, labelKey: 'restrictions.VEGAN' },
    { value: DietaryRestriction.VEGETARIAN, labelKey: 'restrictions.VEGETARIAN' },
    { value: DietaryRestriction.NUT_FREE, labelKey: 'restrictions.NUT_FREE' },
    { value: DietaryRestriction.SEAFOOD_FREE, labelKey: 'restrictions.SEAFOOD_FREE' },
    { value: DietaryRestriction.KOSHER, labelKey: 'restrictions.KOSHER' },
    { value: DietaryRestriction.HALAL, labelKey: 'restrictions.HALAL' },
  ];

  /**
   * Medical condition chips displayed in step 3.
   */
  readonly conditionChips: ConditionChip[] = [
    { value: MedicalCondition.TYPE_2_DIABETES, labelKey: 'medical.TYPE_2_DIABETES' },
    { value: MedicalCondition.HIGH_BLOOD_PRESSURE, labelKey: 'medical.HIGH_BLOOD_PRESSURE' },
    { value: MedicalCondition.COELIAC_DISEASE, labelKey: 'medical.COELIAC_DISEASE' },
    { value: MedicalCondition.HYPOTHYROIDISM, labelKey: 'medical.HYPOTHYROIDISM' },
    { value: MedicalCondition.KIDNEY_DISEASE, labelKey: 'medical.KIDNEY_DISEASE' },
    { value: MedicalCondition.GOUT, labelKey: 'medical.GOUT' },
  ];

  // ─── Navigation ───────────────────────────────────────────────────────────

  /**
   * Calculates the progress bar width percentage based on the current step.
   *
   * @returns A number between 0 and 100 representing completion percentage.
   */
  get progressPercent(): number {
    return (this.currentStep() / this.totalSteps) * 100;
  }

  /**
   * Navigates to the previous step.
   */
  back(): void {
    if (this.currentStep() > 1) {
      this.currentStep.update((s) => s - 1);
    }
  }

  /**
   * Advances to the next step, persisting relevant data to the {@link IamStore}
   * at the appropriate step transitions.
   */
  continue(): void {
    const step = this.currentStep();

    if (step === 1) {
      if (this.bodyForm.invalid) {
        this.bodyForm.markAllAsTouched();
        return;
      }
      const { birthday, biologicalSex, weight, height } = this.bodyForm.value;
      this.iamStore.updateProfile({ birthday: birthday!, biologicalSex: biologicalSex! });
      this.iamStore.updatePhysicalDetails(weight!, height!, this.selectedActivity());
    }

    if (step === 2) {
      this.iamStore.changeGoal(this.selectedGoal());
    }

    if (step === 3) {
      this.iamStore.setRestrictions(Array.from(this.selectedRestrictions()));
      this.iamStore.setMedicalConditions(Array.from(this.selectedConditions()) as string[]);
    }

    if (step === 4) {
      this.router.navigate(['/subscription']);
      return;
    }

    this.currentStep.update((s) => s + 1);
  }

  // ─── Step 1 helpers ───────────────────────────────────────────────────────

  /**
   * Sets the selected activity level from a card click in step 1.
   *
   * @param level - The {@link ActivityLevel} the user clicked.
   */
  selectActivity(level: ActivityLevel): void {
    this.selectedActivity.set(level);
  }

  // ─── Step 2 helpers ───────────────────────────────────────────────────────

  /**
   * Sets the fitness goal from a card click in step 2.
   *
   * @param goal - The {@link UserGoal} the user selected.
   */
  selectGoal(goal: UserGoal): void {
    this.selectedGoal.set(goal);
  }

  // ─── Step 3 helpers ───────────────────────────────────────────────────────

  /**
   * Toggles a dietary restriction chip in step 3.
   *
   * @param restriction - The {@link DietaryRestriction} to toggle.
   */
  toggleRestriction(restriction: DietaryRestriction): void {
    const current = new Set(this.selectedRestrictions());
    if (current.has(restriction)) {
      current.delete(restriction);
    } else {
      current.add(restriction);
    }
    this.selectedRestrictions.set(current);
  }

  /**
   * Returns whether a given dietary restriction is currently selected.
   *
   * @param restriction - The restriction to check.
   * @returns `true` if selected.
   */
  isRestrictionSelected(restriction: DietaryRestriction): boolean {
    return this.selectedRestrictions().has(restriction);
  }

  /**
   * Toggles a medical condition chip in step 3.
   *
   * @param condition - The {@link MedicalCondition} to toggle.
   */
  toggleCondition(condition: MedicalCondition): void {
    const current = new Set(this.selectedConditions());
    if (current.has(condition)) {
      current.delete(condition);
    } else {
      current.add(condition);
    }
    this.selectedConditions.set(current);
  }

  /**
   * Returns whether a given medical condition is currently selected.
   *
   * @param condition - The condition to check.
   * @returns `true` if selected.
   */
  isConditionSelected(condition: MedicalCondition): boolean {
    return this.selectedConditions().has(condition);
  }

  // ─── Expose enums to template ─────────────────────────────────────────────

  /** Exposes {@link UserGoal} enum for use in the template. */
  readonly UserGoal = UserGoal;
}
