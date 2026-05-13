import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { LanguageSwitcher } from '../../../../shared/presentation/components/language-switcher/language-switcher';
import { IamStore } from '../../../../iam/application/iam.store';
import { MetabolicStore } from '../../../../metabolic-adaptation/application/metabolic.store';
import { CityLookupApi } from '../../../../shared/infrastructure/city-lookup-api';
import { ActivityLevel } from '../../../../iam/domain/model/activity-level.enum';
import { DietaryRestriction } from '../../../../iam/domain/model/dietary-restriction.enum';
import { MedicalCondition } from '../../../../iam/domain/model/medical-condition.enum';
import { UserGoal } from '../../../../iam/domain/model/user-goal.enum';

/**
 * Valid panel identifiers for the profile settings navigation.
 */
export type ProfilePanel = 'personal' | 'physical' | 'dietary' | 'language' | 'security';

/**
 * Navigation item descriptor for the left-panel sidebar.
 */
interface PanelNavItem {
  /** The panel key this item activates. */
  id: ProfilePanel;
  /** Display label. */
  label: string;
  /** Icon character for the nav item. */
  icon: string;
}

/**
 * Profile and settings view component.
 *
 * Renders a two-panel layout: a left sidebar for navigation and a right
 * content area that displays the active panel. Panels are switched via the
 * {@link activePanel} signal without sub-routing.
 *
 * Panels:
 * 1. Personal information — name, email, birthday, sex
 * 2. Physical details and goals — weight, height, activity, goal
 * 3. Dietary restrictions — restrictions and medical conditions
 * 4. Language — EN / ES switch via ngx-translate
 * 5. Security and privacy — change password, session info, danger zone
 */
@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe, LanguageSwitcher],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile implements OnInit {
  iamStore = inject(IamStore);

  protected metabolicStore = inject(MetabolicStore);
  private cityLookupApi   = inject(CityLookupApi);
  private translate       = inject(TranslateService);

  readonly knownCities = signal<string[]>([]);

  /** Form builder for constructing panel-specific reactive forms. */
  private fb = inject(FormBuilder);

  /**
   * Currently displayed settings panel.
   */
  activePanel = signal<ProfilePanel>('personal');

  // ─── Panel 1 — Personal information ───────────────────────────────────────

  /**
   * Signal indicating a successful profile save in panel 1.
   */
  personalSaved = signal(false);

  /**
   * Reactive form for personal information.
   */
  personalForm = this.fb.group({
    firstName: [this.iamStore.currentUser()?.firstName ?? '', Validators.required],
    lastName: [this.iamStore.currentUser()?.lastName ?? '', Validators.required],
    email: [this.iamStore.currentUser()?.email ?? '', [Validators.required, Validators.email]],
    birthday: [this.iamStore.currentUser()?.birthday ?? ''],
    biologicalSex: [this.iamStore.currentUser()?.biologicalSex ?? ''],
    homeCity: [this.iamStore.currentUser()?.homeCity ?? ''],
  });

  // ─── Panel 2 — Physical details and goals ─────────────────────────────────

  /**
   * Signal indicating a successful save in panel 2.
   */
  physicalSaved = signal(false);

  showGoalLockConfirm = signal(false);

  /**
   * Currently selected activity level in panel 2.
   */
  selectedActivity = signal<ActivityLevel>(
    this.iamStore.currentUser()?.activityLevel ?? ActivityLevel.MODERATE,
  );

  /**
   * Currently selected fitness goal in panel 2.
   */
  selectedGoal = signal<UserGoal>(this.iamStore.currentUser()?.goal ?? UserGoal.WEIGHT_LOSS);

  protected isGoalLocked   = computed(() => this.metabolicStore.isGoalLocked());
  protected daysUntilUnlock = computed(() => this.metabolicStore.daysUntilUnlock());
  protected unlockDate      = computed(() => this.metabolicStore.unlockDate());

  protected isGoalSwitching = computed(() =>
    this.selectedGoal() !== this.iamStore.currentUser()?.goal
  );

  protected goalName(goal: UserGoal): string {
    const key = goal === UserGoal.WEIGHT_LOSS
      ? 'body_progress.goal_name_weight_loss'
      : 'body_progress.goal_name_muscle_gain';
    return this.translate.instant(key);
  }

  /**
   * Reactive form for physical details.
   */
  physicalForm = this.fb.group({
    height: [this.iamStore.currentUser()?.height ?? 170, Validators.required],
  });

  // ─── Panel 3 — Dietary restrictions ───────────────────────────────────────

  /**
   * Signal controlling the visibility of the "add restriction" dropdown panel.
   */
  showAddRestriction = signal(false);

  /**
   * All available dietary restriction options (for adding new ones).
   */
  readonly allRestrictions: Array<{ value: DietaryRestriction; label: string }> = [
    { value: DietaryRestriction.LACTOSE_FREE, label: 'restrictions.LACTOSE_FREE' },
    { value: DietaryRestriction.GLUTEN_FREE, label: 'restrictions.GLUTEN_FREE' },
    { value: DietaryRestriction.VEGAN, label: 'restrictions.VEGAN' },
    { value: DietaryRestriction.VEGETARIAN, label: 'restrictions.VEGETARIAN' },
    { value: DietaryRestriction.NUT_FREE, label: 'restrictions.NUT_FREE' },
    { value: DietaryRestriction.SEAFOOD_FREE, label: 'restrictions.SEAFOOD_FREE' },
    { value: DietaryRestriction.KOSHER, label: 'restrictions.KOSHER' },
    { value: DietaryRestriction.HALAL, label: 'restrictions.HALAL' },
  ];

  /** Notification toggle signals (visual only). */
  notif1 = signal(true);
  notif2 = signal(true);
  notif3 = signal(false);
  notif4 = signal(true);
  notif5 = signal(false);

  // ─── Panel 5 — Security ───────────────────────────────────────────────────

  /**
   * Reactive form for changing password.
   */
  passwordForm = this.fb.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required],
  });

  /**
   * Signal showing a success message after simulated password change.
   */
  passwordChanged = signal(false);

  // ─── Nav items ────────────────────────────────────────────────────────────

  /**
   * Left-panel navigation items.
   */
  readonly navItems: PanelNavItem[] = [
    { id: 'personal', label: 'profile.nav_personal', icon: '' },
    { id: 'physical', label: 'profile.nav_physical', icon: '' },
    { id: 'dietary', label: 'profile.nav_dietary', icon: '' },
    { id: 'language', label: 'profile.nav_language', icon: '' },
    { id: 'security', label: 'profile.nav_security', icon: '' },
  ];

  /**
   * All available medical condition options.
   */
  readonly allConditions: Array<{ value: MedicalCondition; label: string }> = [
    { value: MedicalCondition.TYPE_2_DIABETES, label: 'medical.TYPE_2_DIABETES' },
    { value: MedicalCondition.HIGH_BLOOD_PRESSURE, label: 'medical.HIGH_BLOOD_PRESSURE' },
    { value: MedicalCondition.COELIAC_DISEASE, label: 'medical.COELIAC_DISEASE' },
    { value: MedicalCondition.HYPOTHYROIDISM, label: 'medical.HYPOTHYROIDISM' },
    { value: MedicalCondition.KIDNEY_DISEASE, label: 'medical.KIDNEY_DISEASE' },
    { value: MedicalCondition.GOUT, label: 'medical.GOUT' },
  ];

  // ─── Methods ──────────────────────────────────────────────────────────────

  /**
   * Switches the active settings panel.
   *
   * @param panel - The {@link ProfilePanel} to activate.
   */
  ngOnInit(): void {
    this.cityLookupApi.getKnownCities().subscribe({
      next: cities => this.knownCities.set(cities),
    });
    if (!this.metabolicStore.currentMetric()) {
      void this.metabolicStore.initialise();
    }
  }

  setPanel(panel: ProfilePanel): void {
    this.activePanel.set(panel);
  }

  /**
   * Saves personal information changes from panel 1.
   */
  applyPersonal(): void {
    if (this.personalForm.invalid) {
      this.personalForm.markAllAsTouched();
      return;
    }
    const { firstName, lastName, birthday, biologicalSex, homeCity } = this.personalForm.value;
    if (this.iamStore.currentUser()?.homeCity && !homeCity?.trim()) {
      this.personalForm.get('homeCity')?.setErrors({ required: true });
      this.personalForm.get('homeCity')?.markAsTouched();
      return;
    }
    this.iamStore.updateProfile({
      firstName: firstName!,
      lastName: lastName!,
      birthday: birthday ?? '',
      biologicalSex: biologicalSex ?? '',
      homeCity: homeCity ?? '',
    });
    this.personalSaved.set(true);
    setTimeout(() => this.personalSaved.set(false), 2500);
  }

  /**
   * Sets the selected activity level in panel 2.
   *
   * @param level - The activity level the user selected.
   */
  setActivity(level: ActivityLevel): void {
    this.selectedActivity.set(level);
  }

  /**
   * Sets the selected goal in panel 2.
   *
   * @param goal - The {@link UserGoal} the user selected.
   */
  setGoal(goal: UserGoal): void {
    this.selectedGoal.set(goal);
  }

  /**
   * Saves physical details. If the user is switching goal while locked,
   * shows a confirmation modal instead of applying immediately.
   */
  applyPhysical(): void {
    if (this.physicalForm.invalid) {
      this.physicalForm.markAllAsTouched();
      return;
    }
    if (this.isGoalSwitching() && this.isGoalLocked()) {
      this.showGoalLockConfirm.set(true);
      return;
    }
    this.commitPhysical();
  }

  onConfirmGoalSwitch(): void {
    this.showGoalLockConfirm.set(false);
    this.commitPhysical();
  }

  onCancelGoalSwitch(): void {
    this.showGoalLockConfirm.set(false);
    this.selectedGoal.set(this.iamStore.currentUser()?.goal ?? UserGoal.WEIGHT_LOSS);
  }

  private commitPhysical(): void {
    const { height } = this.physicalForm.value;
    const currentWeight = this.iamStore.currentUser()?.weight ?? 70;
    this.iamStore.updatePhysicalDetails(currentWeight, height!, this.selectedActivity());
    this.iamStore.changeGoal(this.selectedGoal());
    this.physicalSaved.set(true);
    setTimeout(() => this.physicalSaved.set(false), 2500);
  }

  /**
   * Returns a label for a given restriction value.
   *
   * @param r - The {@link DietaryRestriction} to look up.
   * @returns The display label.
   */
  restrictionLabel(r: DietaryRestriction): string {
    return this.allRestrictions.find((x) => x.value === r)?.label ?? r;
  }

  /**
   * Toggles a medical condition chip in the dietary panel.
   *
   * @param condition - The {@link MedicalCondition} to toggle.
   */
  toggleCondition(condition: MedicalCondition): void {
    const current = this.iamStore.currentUser()?.medicalConditions ?? [];
    const condStr = condition as string;
    if (current.includes(condStr)) {
      this.iamStore.removeMedicalCondition(condStr);
    } else {
      this.iamStore.addMedicalConditionEnum(condition);
    }
  }

  /**
   * Returns whether a given medical condition is currently active on the user.
   *
   * @param condition - The {@link MedicalCondition} to check.
   * @returns `true` if the condition is active.
   */
  isConditionSelected(condition: MedicalCondition): boolean {
    return (this.iamStore.currentUser()?.medicalConditions ?? []).includes(condition as string);
  }

  /**
   * Simulates a password change (no backend call).
   */
  changePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }
    this.passwordForm.reset();
    this.passwordChanged.set(true);
    setTimeout(() => this.passwordChanged.set(false), 3000);
  }

  /**
   * Logs the user out of all sessions (delegates to store logout).
   */
  logoutAll(): void {
    this.iamStore.logout();
  }

  /** Exposes {@link ActivityLevel} enum to the template. */
  readonly ActivityLevel = ActivityLevel;

  /** Exposes {@link UserGoal} enum to the template. */
  readonly UserGoal = UserGoal;

  /** Exposes {@link MedicalCondition} enum to the template. */
  readonly MedicalCondition = MedicalCondition;
}
