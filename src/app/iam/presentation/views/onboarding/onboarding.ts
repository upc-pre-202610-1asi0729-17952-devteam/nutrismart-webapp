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
import { MetabolicStore } from '../../../../metabolic-adaptation/application/metabolic.store';
import { ActivityLevel } from '../../../../iam/domain/model/activity-level.enum';
import { DietaryRestriction } from '../../../../iam/domain/model/dietary-restriction.enum';
import { MedicalCondition } from '../../../../iam/domain/model/medical-condition.enum';
import { UserGoal } from '../../../../iam/domain/model/user-goal.enum';

/**
 * Represents one selectable activity level card in step 1.
 */
interface ActivityCard {
  level: ActivityLevel;
  labelKey: string;
  descKey: string;
}

/**
 * Represents a dietary restriction toggle chip in step 4.
 */
interface RestrictionChip {
  value: DietaryRestriction;
  labelKey: string;
}

/**
 * Represents a medical condition toggle chip in step 4.
 */
interface ConditionChip {
  value: MedicalCondition;
  labelKey: string;
}

/**
 * Pant size entry for the body composition mode B selector.
 */
interface PantSizeEntry {
  /** US pant size (waist in inches). */
  size: number;
  /** Approximate waist circumference in centimetres. */
  waistCm: number;
}

/**
 * Visual level entry for the body composition mode C selector.
 */
interface VisualLevel {
  /** i18n key for the level label. */
  key: string;
  /** i18n key for the body fat range displayed under the label. */
  rangeKey: string;
  /** Body fat percentage value stored as overrideBodyFatPercent (midpoint of range). */
  override: number;
}

/**
 * Multi-step onboarding wizard component.
 *
 * Guides new users through personalising their NutriSmart experience:
 * 1. About you + Body (birthday, biological sex, weight, height, activity level)
 * 2. Your goal (weight loss vs. muscle gain)
 * 3. Body composition — MUSCLE_GAIN only (waist cm / pant size / visual estimate)
 * 4. Dietary restrictions & Medical conditions
 * 5. Summary with calculated macros → navigates to /subscription
 *
 * WEIGHT_LOSS users skip step 3 (internal step numbers jump from 2 to 4).
 * The displayed step counter always shows a sequential number via displayStep.
 *
 * State is managed with Angular signals; IamStore and MetabolicStore are updated
 * at the appropriate step transitions.
 */
@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe, LanguageSwitcher],
  templateUrl: './onboarding.html',
  styleUrl: './onboarding.css',
})
export class Onboarding {
  iamStore       = inject(IamStore);
  metabolicStore = inject(MetabolicStore);

  private router = inject(Router);
  private fb     = inject(FormBuilder);

  /** Expose enum to template. */
  readonly UserGoal = UserGoal;

  // ─── Step navigation ──────────────────────────────────────────────────────

  /** Internal step number. WEIGHT_LOSS skips 3 (jumps 2 → 4). */
  currentStep = signal(1);

  /**
   * Total steps shown in the progress counter.
   * MUSCLE_GAIN has 5 steps (includes composition); WEIGHT_LOSS has 4.
   */
  get totalSteps(): number {
    return this.selectedGoal() === UserGoal.MUSCLE_GAIN ? 5 : 4;
  }

  /**
   * Sequential display step number (always 1-N, regardless of internal skips).
   * WEIGHT_LOSS: internal steps 4 and 5 display as 3 and 4.
   */
  get displayStep(): number {
    const step     = this.currentStep();
    const isMuscle = this.selectedGoal() === UserGoal.MUSCLE_GAIN;
    if (!isMuscle && step >= 4) return step - 1;
    return step;
  }

  /** Progress bar fill percentage. */
  get progressPercent(): number {
    return (this.displayStep / this.totalSteps) * 100;
  }

  // ─── Step 1 state ─────────────────────────────────────────────────────────

  selectedActivity = signal<ActivityLevel>(ActivityLevel.MODERATE);

  bodyForm = this.fb.group({
    birthday:      ['', [Validators.required, minAgeValidator(13)]],
    biologicalSex: ['', Validators.required],
    weight:        [null as number | null, [Validators.required, Validators.min(30), Validators.max(300)]],
    height:        [null as number | null, [Validators.required, Validators.min(100), Validators.max(250)]],
    homeCity:      ['', Validators.required],
  });

  // ─── Step 2 state ─────────────────────────────────────────────────────────

  selectedGoal = signal<UserGoal>(UserGoal.WEIGHT_LOSS);

  // ─── Step 3 state (MUSCLE_GAIN only) ─────────────────────────────────────

  /** Active input mode for the composition step. */
  selectedMode = signal<'A' | 'B' | 'C'>('A');

  /** Mode A: raw waist circumference input value. */
  waistCmInput = signal<string>('');

  /** Mode B: selected US pant size. */
  selectedPantSize = signal<number | null>(null);

  /** Mode C: index of the selected visual level. */
  selectedVisualLevel = signal<number | null>(null);

  /** True when the composition step has a valid, submittable selection. */
  get step3Valid(): boolean {
    const mode = this.selectedMode();
    if (mode === 'A') {
      const v = parseFloat(this.waistCmInput());
      return !isNaN(v) && v >= 30 && v <= 200;
    }
    if (mode === 'B') return this.selectedPantSize() !== null;
    return this.selectedVisualLevel() !== null;
  }

  /** Disables the Continue button only on the composition step until valid. */
  get continueDisabled(): boolean {
    return this.currentStep() === 3 && !this.step3Valid;
  }

  // ─── Step 4 state ─────────────────────────────────────────────────────────

  selectedRestrictions = signal<Set<DietaryRestriction>>(new Set());
  selectedConditions   = signal<Set<MedicalCondition>>(new Set());

  // ─── Static data ──────────────────────────────────────────────────────────

  readonly activityCards: ActivityCard[] = [
    { level: ActivityLevel.SEDENTARY,   labelKey: 'onboarding.sedentary',   descKey: 'onboarding.sedentary_desc'   },
    { level: ActivityLevel.MODERATE,    labelKey: 'onboarding.moderate',    descKey: 'onboarding.moderate_desc'    },
    { level: ActivityLevel.ACTIVE,      labelKey: 'onboarding.active',      descKey: 'onboarding.active_desc'      },
    { level: ActivityLevel.VERY_ACTIVE, labelKey: 'onboarding.very_active', descKey: 'onboarding.very_active_desc' },
  ];

  readonly restrictionChips: RestrictionChip[] = [
    { value: DietaryRestriction.LACTOSE_FREE,  labelKey: 'restrictions.LACTOSE_FREE'  },
    { value: DietaryRestriction.GLUTEN_FREE,   labelKey: 'restrictions.GLUTEN_FREE'   },
    { value: DietaryRestriction.VEGAN,         labelKey: 'restrictions.VEGAN'         },
    { value: DietaryRestriction.VEGETARIAN,    labelKey: 'restrictions.VEGETARIAN'    },
    { value: DietaryRestriction.NUT_FREE,      labelKey: 'restrictions.NUT_FREE'      },
    { value: DietaryRestriction.SEAFOOD_FREE,  labelKey: 'restrictions.SEAFOOD_FREE'  },
    { value: DietaryRestriction.KOSHER,        labelKey: 'restrictions.KOSHER'        },
    { value: DietaryRestriction.HALAL,         labelKey: 'restrictions.HALAL'         },
  ];

  readonly conditionChips: ConditionChip[] = [
    { value: MedicalCondition.TYPE_2_DIABETES,    labelKey: 'medical.TYPE_2_DIABETES'    },
    { value: MedicalCondition.HIGH_BLOOD_PRESSURE, labelKey: 'medical.HIGH_BLOOD_PRESSURE' },
    { value: MedicalCondition.COELIAC_DISEASE,    labelKey: 'medical.COELIAC_DISEASE'    },
    { value: MedicalCondition.HYPOTHYROIDISM,     labelKey: 'medical.HYPOTHYROIDISM'     },
    { value: MedicalCondition.KIDNEY_DISEASE,     labelKey: 'medical.KIDNEY_DISEASE'     },
    { value: MedicalCondition.GOUT,               labelKey: 'medical.GOUT'               },
  ];

  /** US pant size → waist cm conversion table (mode B). */
  readonly pantSizes: PantSizeEntry[] = [
    { size: 26, waistCm: 66 },
    { size: 28, waistCm: 71 },
    { size: 30, waistCm: 76 },
    { size: 32, waistCm: 81 },
    { size: 34, waistCm: 87 },
    { size: 36, waistCm: 92 },
    { size: 38, waistCm: 97 },
  ];

  /** Visual body fat levels with midpoint override values (mode C). */
  readonly visualLevels: VisualLevel[] = [
    { key: 'onboarding.visual_very_lean',    rangeKey: 'onboarding.visual_range_very_lean',    override: 10.5 },
    { key: 'onboarding.visual_lean',         rangeKey: 'onboarding.visual_range_lean',         override: 15.5 },
    { key: 'onboarding.visual_average',      rangeKey: 'onboarding.visual_range_average',      override: 20.5 },
    { key: 'onboarding.visual_overweight',   rangeKey: 'onboarding.visual_range_overweight',   override: 25.5 },
    { key: 'onboarding.visual_obese',        rangeKey: 'onboarding.visual_range_obese',        override: 32.0 },
  ];

  // ─── Navigation ───────────────────────────────────────────────────────────

  back(): void {
    const step     = this.currentStep();
    const isMuscle = this.selectedGoal() === UserGoal.MUSCLE_GAIN;
    if (step === 4 && !isMuscle) {
      this.currentStep.set(2);
      return;
    }
    if (step > 1) this.currentStep.update(s => s - 1);
  }

  async continue(): Promise<void> {
    const step     = this.currentStep();
    const isMuscle = this.selectedGoal() === UserGoal.MUSCLE_GAIN;

    if (step === 1) {
      if (this.bodyForm.invalid) { this.bodyForm.markAllAsTouched(); return; }
      const { birthday, biologicalSex, weight, height, homeCity } = this.bodyForm.value;
      this.iamStore.updateProfile({ birthday: birthday!, biologicalSex: biologicalSex!, homeCity: homeCity! });
      this.iamStore.updatePhysicalDetails(weight!, height!, this.selectedActivity());
      this.currentStep.update(s => s + 1);
      return;
    }

    if (step === 2) {
      this.iamStore.changeGoal(this.selectedGoal());
      this.currentStep.set(isMuscle ? 3 : 4);
      return;
    }

    if (step === 3) {
      const { waistCm, override } = this.getCompositionArgs();
      await this.metabolicStore.setComposition(waistCm, override);
      this.currentStep.update(s => s + 1);
      return;
    }

    if (step === 4) {
      this.iamStore.setRestrictions(Array.from(this.selectedRestrictions()));
      this.iamStore.setMedicalConditions(Array.from(this.selectedConditions()) as string[]);
      this.currentStep.update(s => s + 1);
      return;
    }

    if (step === 5) {
      const weight = this.bodyForm.value.weight!;
      await this.metabolicStore.logWeight(weight);
      await this.metabolicStore.applyInitialTarget(this.selectedGoal());
      this.router.navigate(['/subscription']);
    }
  }

  // ─── Step 1 helpers ───────────────────────────────────────────────────────

  selectActivity(level: ActivityLevel): void {
    this.selectedActivity.set(level);
  }

  // ─── Step 2 helpers ───────────────────────────────────────────────────────

  selectGoal(goal: UserGoal): void {
    this.selectedGoal.set(goal);
  }

  // ─── Step 3 helpers ───────────────────────────────────────────────────────

  selectMode(mode: 'A' | 'B' | 'C'): void {
    this.selectedMode.set(mode);
  }

  onWaistCmInput(event: Event): void {
    this.waistCmInput.set((event.target as HTMLInputElement).value);
  }

  selectPantSize(size: number): void {
    this.selectedPantSize.set(size);
  }

  selectVisualLevel(index: number): void {
    this.selectedVisualLevel.set(index);
  }

  private getCompositionArgs(): { waistCm: number | undefined; override: number | undefined } {
    const mode = this.selectedMode();
    if (mode === 'A') {
      return { waistCm: parseFloat(this.waistCmInput()), override: undefined };
    }
    if (mode === 'B') {
      const entry = this.pantSizes.find(s => s.size === this.selectedPantSize());
      return { waistCm: entry?.waistCm, override: undefined };
    }
    const idx   = this.selectedVisualLevel();
    const level = idx !== null ? this.visualLevels[idx] : undefined;
    return { waistCm: undefined, override: level?.override };
  }

  // ─── Step 4 helpers ───────────────────────────────────────────────────────

  toggleRestriction(restriction: DietaryRestriction): void {
    const current = new Set(this.selectedRestrictions());
    current.has(restriction) ? current.delete(restriction) : current.add(restriction);
    this.selectedRestrictions.set(current);
  }

  isRestrictionSelected(restriction: DietaryRestriction): boolean {
    return this.selectedRestrictions().has(restriction);
  }

  toggleCondition(condition: MedicalCondition): void {
    const current = new Set(this.selectedConditions());
    current.has(condition) ? current.delete(condition) : current.add(condition);
    this.selectedConditions.set(current);
  }

  isConditionSelected(condition: MedicalCondition): boolean {
    return this.selectedConditions().has(condition);
  }
}
