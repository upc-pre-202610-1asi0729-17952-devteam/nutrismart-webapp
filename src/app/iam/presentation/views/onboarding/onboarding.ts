import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { IamStore } from '../../../../iam/application/iam.store';
import { ActivityLevel } from '../../../../iam/domain/model/activity-level.enum';
import { DietaryRestriction } from '../../../../iam/domain/model/dietary-restriction.enum';
import { UserGoal } from '../../../../iam/domain/model/user-goal.enum';

/**
 * Represents one selectable activity level card in step 2.
 */
interface ActivityCard {
  /** The {@link ActivityLevel} value this card represents. */
  level: ActivityLevel;
  /** Icon displayed on the card. */
  icon: string;
  /** Human-readable label. */
  label: string;
  /** Short description shown below the label. */
  description: string;
}

/**
 * Represents a dietary restriction toggle chip in step 4.
 */
interface RestrictionChip {
  /** The {@link DietaryRestriction} enum value. */
  value: DietaryRestriction;
  /** Display label for the chip. */
  label: string;
}

/**
 * Multi-step onboarding wizard component.
 *
 * Guides new users through 5 steps to personalise their NutriSmart experience:
 * 1. About you (name & demographics)
 * 2. Your body (weight, height, activity level)
 * 3. Your goal (weight loss vs. muscle gain)
 * 4. Dietary restrictions
 * 5. Summary with estimated macros
 *
 * State is managed with Angular signals; the {@link IamStore} is updated at
 * the appropriate steps. At step 5 the user is directed to `/subscription`.
 */
@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [ReactiveFormsModule],
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

  /**
   * Current step number (1–5). Controls which step content is rendered.
   */
  currentStep = signal(1);

  /**
   * Selected activity level in step 2. Defaults to MODERATE.
   */
  selectedActivity = signal<ActivityLevel>(ActivityLevel.MODERATE);

  /**
   * Selected fitness goal in step 3. Defaults to WEIGHT_LOSS.
   */
  selectedGoal = signal<UserGoal>(UserGoal.WEIGHT_LOSS);

  /**
   * Set of dietary restrictions selected in step 4.
   */
  selectedRestrictions = signal<Set<DietaryRestriction>>(new Set());

  // ─── Step forms ───────────────────────────────────────────────────────────

  /**
   * Step 1 reactive form (personal info).
   */
  step1Form = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    birthday: [''],
    biologicalSex: [''],
  });

  /**
   * Step 2 reactive form (physical stats).
   */
  step2Form = this.fb.group({
    weight: [70, [Validators.required, Validators.min(30), Validators.max(300)]],
    height: [170, [Validators.required, Validators.min(100), Validators.max(250)]],
  });

  // ─── Static data ──────────────────────────────────────────────────────────

  /**
   * Activity level cards displayed in step 2.
   */
  readonly activityCards: ActivityCard[] = [
    { level: ActivityLevel.SEDENTARY,  icon: '🛋️',  label: 'Sedentary',  description: 'Little or no exercise' },
    { level: ActivityLevel.MODERATE,   icon: '🚶',  label: 'Moderate',   description: 'Light exercise 1–3 days/week' },
    { level: ActivityLevel.ACTIVE,     icon: '🏃',  label: 'Active',     description: 'Moderate exercise 3–5 days/week' },
    { level: ActivityLevel.VERY_ACTIVE,icon: '⚡',  label: 'Very Active', description: 'Hard exercise 6–7 days/week' },
  ];

  /**
   * Restriction chips displayed in step 4.
   */
  readonly restrictionChips: RestrictionChip[] = [
    { value: DietaryRestriction.LACTOSE_FREE,  label: 'Lactose-free' },
    { value: DietaryRestriction.GLUTEN_FREE,   label: 'Gluten-free' },
    { value: DietaryRestriction.VEGAN,         label: 'Vegan' },
    { value: DietaryRestriction.VEGETARIAN,    label: 'Vegetarian' },
    { value: DietaryRestriction.NUT_FREE,      label: 'Nut-free' },
    { value: DietaryRestriction.SEAFOOD_FREE,  label: 'Seafood-free' },
    { value: DietaryRestriction.KOSHER,        label: 'Kosher' },
    { value: DietaryRestriction.HALAL,         label: 'Halal' },
  ];

  // ─── Navigation ───────────────────────────────────────────────────────────

  /**
   * Calculates the progress bar width percentage based on the current step.
   *
   * @returns A number between 0 and 100 representing completion percentage.
   */
  get progressPercent(): number {
    return (this.currentStep() / 5) * 100;
  }

  /**
   * Advances to the next step, persisting relevant data to the {@link IamStore}
   * at the appropriate step transitions.
   */
  continue(): void {
    const step = this.currentStep();

    if (step === 1) {
      if (this.step1Form.invalid) { this.step1Form.markAllAsTouched(); return; }
      const { firstName, lastName } = this.step1Form.value;
      this.iamStore.updateProfile({ firstName: firstName!, lastName: lastName! });
    }

    if (step === 2) {
      if (this.step2Form.invalid) { this.step2Form.markAllAsTouched(); return; }
      const { weight, height } = this.step2Form.value;
      this.iamStore.updatePhysicalDetails(weight!, height!, this.selectedActivity());
    }

    if (step === 3) {
      this.iamStore.changeGoal(this.selectedGoal());
    }

    if (step === 4) {
      for (const r of this.selectedRestrictions()) {
        this.iamStore.addRestriction(r);
      }
    }

    if (step === 5) {
      this.router.navigate(['/subscription']);
      return;
    }

    this.currentStep.update(s => s + 1);
  }

  /**
   * Skips the current step without validation or data persistence and
   * advances to the next step. Available for steps 1–4 only.
   */
  skip(): void {
    if (this.currentStep() < 5) {
      this.currentStep.update(s => s + 1);
    }
  }

  // ─── Step 2 helpers ───────────────────────────────────────────────────────

  /**
   * Sets the selected activity level from a card click in step 2.
   *
   * @param level - The {@link ActivityLevel} the user clicked.
   */
  selectActivity(level: ActivityLevel): void {
    this.selectedActivity.set(level);
  }

  // ─── Step 3 helpers ───────────────────────────────────────────────────────

  /**
   * Sets the fitness goal from a card click in step 3.
   *
   * @param goal - The {@link UserGoal} the user selected.
   */
  selectGoal(goal: UserGoal): void {
    this.selectedGoal.set(goal);
  }

  // ─── Step 4 helpers ───────────────────────────────────────────────────────

  /**
   * Toggles a dietary restriction chip in step 4.
   * If already selected, removes it; otherwise adds it.
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

  // ─── Expose enums to template ─────────────────────────────────────────────

  /** Exposes {@link UserGoal} enum for use in the template. */
  readonly UserGoal = UserGoal;
}
