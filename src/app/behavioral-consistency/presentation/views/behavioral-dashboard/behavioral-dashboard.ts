import { Component, computed, inject, OnInit } from '@angular/core';
import { NgClass } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';
import { IamStore } from '../../../../iam/application/iam.store';
import { BehavioralConsistencyStore } from '../../../application/behavioral-consistency.store';
import { AdherenceStatus } from '../../../domain/model/adherence-status.enum';

interface DashboardMealVm {
  nameKey: string;
  description: string;
  caloriesLabel: string;
  dotClass: string;
  notLogged: boolean;
  missed: boolean;
}

interface DashboardMacroVm {
  nameKey: string;
  consumed: number;
  target: number;
  colorClass: string;
}

interface DashboardVm {
  status: AdherenceStatus;
  greetingKey: string;
  greetingParams: Record<string, unknown>;
  badgeLabelKey: string;
  badgeLabelParams: Record<string, unknown>;
  badgeClass: string;
  showAlert: boolean;
  alertIcon: string;
  alertTitleKey: string;
  alertTitleParams: Record<string, unknown>;
  alertDescKey: string;
  alertBtnKey: string;
  alertButtonClass: string;
  consumedCalories: number;
  targetCalories: number;
  remainingCalories: number;
  netBalance: number;
  progressPercent: number;
  topAccentClass: string;
  googleFitCalories: number | null;
  netBalanceSubtitleKey: string | null;
  meals: DashboardMealVm[];
  macros: DashboardMacroVm[];
  streak: number;
  streakDescKey: string;
  streakDescParams: Record<string, unknown>;
  streakFooterKey: string;
  streakFooterParams: Record<string, unknown>;
  streakClass: string;
  weekDots: boolean[];
  todayIndex: number;
  showNoMealsLoggedBlock: boolean;
  noMealsDays: number;
}

@Component({
  selector: 'app-behavioral-dashboard',
  imports: [NgClass, MatIconModule, TranslatePipe],
  templateUrl: './behavioral-dashboard.html',
  styleUrl: './behavioral-dashboard.css',
})
export class BehavioralDashboard implements OnInit {
  protected readonly iamStore = inject(IamStore);
  protected readonly behavioralStore = inject(BehavioralConsistencyStore);

  protected readonly currentUser = this.iamStore.currentUser;
  protected readonly currentProgress = this.behavioralStore.currentProgress;
  protected readonly error = this.behavioralStore.error;

  protected readonly hasProgress = computed(() => this.currentProgress() !== null);

  protected readonly weekLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  protected readonly dateLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  protected readonly dashboardVm = computed<DashboardVm>(() => {
    const status = this.currentProgress()?.adherenceStatus ?? AdherenceStatus.ON_TRACK;

    if (status === AdherenceStatus.AT_RISK) return this.buildAtRiskVm();
    if (status === AdherenceStatus.DROPPED) return this.buildDroppedVm();
    if (status === AdherenceStatus.RECOVERED) return this.buildRecoveredVm();
    return this.buildOnTrackVm();
  });

  ngOnInit(): void {
    this.behavioralStore.loadPreviewProgress();
  }

  protected onGoalMet(): void {
    this.behavioralStore.markGoalMet();
  }

  protected onGoalMissed(): void {
    this.behavioralStore.markGoalMissed();
  }

  protected macroPercent(consumed: number, target: number): number {
    return Math.min(Math.round((consumed / target) * 100), 100);
  }

  private get firstName(): string {
    return this.currentUser()?.firstName ?? 'Ana';
  }

  private notLoggedMeal(nameKey: string, dotClass: string, missed = false): DashboardMealVm {
    return { nameKey, description: '', caloriesLabel: '— kcal', dotClass, notLogged: true, missed };
  }

  private buildOnTrackVm(): DashboardVm {
    return {
      status: AdherenceStatus.ON_TRACK,
      greetingKey: 'dashboard.greeting',
      greetingParams: { name: this.firstName },
      badgeLabelKey: 'dashboard.status_on_track',
      badgeLabelParams: { streak: 5 },
      badgeClass: 'status-on-track',
      showAlert: false,
      alertIcon: '',
      alertTitleKey: '',
      alertTitleParams: {},
      alertDescKey: '',
      alertBtnKey: '',
      alertButtonClass: '',
      consumedCalories: 1340,
      targetCalories: 1800,
      remainingCalories: 460,
      netBalance: 1040,
      progressPercent: 74,
      topAccentClass: 'accent-teal',
      googleFitCalories: 300,
      netBalanceSubtitleKey: null,
      meals: [
        { nameKey: 'dashboard.meal_breakfast', description: 'Oatmeal + banana · 7:30 am', caloriesLabel: '380 kcal', dotClass: 'dot-orange', notLogged: false, missed: false },
        { nameKey: 'dashboard.meal_lunch', description: 'Rice + chicken + salad · 1:00 pm', caloriesLabel: '720 kcal', dotClass: 'dot-teal', notLogged: false, missed: false },
        { nameKey: 'dashboard.meal_snack', description: 'Greek yoghurt · 4:00 pm', caloriesLabel: '240 kcal', dotClass: 'dot-pink', notLogged: false, missed: false },
        this.notLoggedMeal('dashboard.meal_dinner', 'dot-empty'),
      ],
      macros: [
        { nameKey: 'dashboard.macro_protein', consumed: 82, target: 120, colorClass: 'macro-teal' },
        { nameKey: 'dashboard.macro_carbs', consumed: 165, target: 220, colorClass: 'macro-orange' },
        { nameKey: 'dashboard.macro_fat', consumed: 42, target: 65, colorClass: 'macro-pink' },
      ],
      streak: 5,
      streakDescKey: 'dashboard.streak_on_track_desc',
      streakDescParams: {},
      streakFooterKey: 'dashboard.streak_on_track_footer',
      streakFooterParams: { days: 7 },
      streakClass: 'streak-on-track',
      weekDots: [true, true, true, true, true, false, false],
      todayIndex: 4,
      showNoMealsLoggedBlock: false,
      noMealsDays: 0,
    };
  }

  private buildAtRiskVm(): DashboardVm {
    return {
      status: AdherenceStatus.AT_RISK,
      greetingKey: 'dashboard.greeting',
      greetingParams: { name: this.firstName },
      badgeLabelKey: 'dashboard.status_at_risk',
      badgeLabelParams: { misses: 3 },
      badgeClass: 'status-at-risk',
      showAlert: true,
      alertIcon: '⚠️',
      alertTitleKey: 'dashboard.alert_at_risk_title',
      alertTitleParams: { days: 3 },
      alertDescKey: 'dashboard.alert_at_risk_desc',
      alertBtnKey: 'dashboard.alert_at_risk_btn',
      alertButtonClass: 'risk-button-orange',
      consumedCalories: 310,
      targetCalories: 1800,
      remainingCalories: 1490,
      netBalance: 1490,
      progressPercent: 17,
      topAccentClass: 'accent-orange',
      googleFitCalories: null,
      netBalanceSubtitleKey: 'dashboard.no_activity_synced',
      meals: [
        { nameKey: 'dashboard.meal_breakfast', description: 'Oatmeal + banana · 7:30 am', caloriesLabel: '310 kcal', dotClass: 'dot-orange', notLogged: false, missed: false },
        this.notLoggedMeal('dashboard.meal_lunch', 'dot-danger', true),
        this.notLoggedMeal('dashboard.meal_snack', 'dot-danger', true),
        this.notLoggedMeal('dashboard.meal_dinner', 'dot-empty'),
      ],
      macros: [
        { nameKey: 'dashboard.macro_protein', consumed: 18, target: 120, colorClass: 'macro-teal' },
        { nameKey: 'dashboard.macro_carbs', consumed: 38, target: 220, colorClass: 'macro-orange' },
        { nameKey: 'dashboard.macro_fat', consumed: 9, target: 65, colorClass: 'macro-pink' },
      ],
      streak: 0,
      streakDescKey: 'dashboard.streak_at_risk_desc',
      streakDescParams: { misses: 3 },
      streakFooterKey: 'dashboard.streak_at_risk_footer',
      streakFooterParams: {},
      streakClass: 'streak-at-risk',
      weekDots: [true, false, false, false, false, false, false],
      todayIndex: 4,
      showNoMealsLoggedBlock: false,
      noMealsDays: 0,
    };
  }

  private buildDroppedVm(): DashboardVm {
    const targetCalories = 1800;
    return {
      status: AdherenceStatus.DROPPED,
      greetingKey: 'dashboard.greeting',
      greetingParams: { name: this.firstName },
      badgeLabelKey: 'dashboard.status_dropped',
      badgeLabelParams: { days: 7 },
      badgeClass: 'status-dropped',
      showAlert: true,
      alertIcon: '💙',
      alertTitleKey: 'dashboard.alert_dropped_title',
      alertTitleParams: { days: 7 },
      alertDescKey: 'dashboard.alert_dropped_desc',
      alertBtnKey: 'dashboard.alert_dropped_btn',
      alertButtonClass: 'risk-button-red',
      consumedCalories: 0,
      targetCalories,
      remainingCalories: targetCalories,
      netBalance: 0,
      progressPercent: 0,
      topAccentClass: 'accent-red',
      googleFitCalories: null,
      netBalanceSubtitleKey: null,
      meals: [],
      macros: [
        { nameKey: 'dashboard.macro_protein', consumed: 0, target: 120, colorClass: 'macro-teal' },
        { nameKey: 'dashboard.macro_carbs', consumed: 0, target: 220, colorClass: 'macro-orange' },
        { nameKey: 'dashboard.macro_fat', consumed: 0, target: 65, colorClass: 'macro-pink' },
      ],
      streak: 0,
      streakDescKey: 'dashboard.streak_dropped_desc',
      streakDescParams: { days: 7 },
      streakFooterKey: 'dashboard.streak_dropped_footer',
      streakFooterParams: {},
      streakClass: 'streak-dropped',
      weekDots: [false, false, false, false, false, false, false],
      todayIndex: -1,
      showNoMealsLoggedBlock: true,
      noMealsDays: 7,
    };
  }

  private buildRecoveredVm(): DashboardVm {
    const targetCalories = 1800;
    const consumedCalories = 480;
    return {
      status: AdherenceStatus.RECOVERED,
      greetingKey: 'dashboard.greeting_back',
      greetingParams: { name: this.firstName },
      badgeLabelKey: 'dashboard.status_recovered',
      badgeLabelParams: {},
      badgeClass: 'status-recovered',
      showAlert: true,
      alertIcon: '🎉',
      alertTitleKey: 'dashboard.alert_recovered_title',
      alertTitleParams: {},
      alertDescKey: 'dashboard.alert_recovered_desc',
      alertBtnKey: 'dashboard.alert_recovered_btn',
      alertButtonClass: 'risk-button-green',
      consumedCalories,
      targetCalories,
      remainingCalories: targetCalories - consumedCalories,
      netBalance: 0,
      progressPercent: Math.round((consumedCalories / targetCalories) * 100),
      topAccentClass: 'accent-green',
      googleFitCalories: null,
      netBalanceSubtitleKey: null,
      meals: [
        { nameKey: 'dashboard.meal_breakfast', description: 'Oatmeal + banana · 7:30 am', caloriesLabel: '480 kcal', dotClass: 'dot-orange', notLogged: false, missed: false },
        this.notLoggedMeal('dashboard.meal_lunch', 'dot-empty'),
        this.notLoggedMeal('dashboard.meal_snack', 'dot-empty'),
        this.notLoggedMeal('dashboard.meal_dinner', 'dot-empty'),
      ],
      macros: [
        { nameKey: 'dashboard.macro_protein', consumed: Math.round((consumedCalories * 0.2) / 4), target: 120, colorClass: 'macro-teal' },
        { nameKey: 'dashboard.macro_carbs', consumed: Math.round((consumedCalories * 0.5) / 4), target: 220, colorClass: 'macro-orange' },
        { nameKey: 'dashboard.macro_fat', consumed: Math.round((consumedCalories * 0.3) / 9), target: 65, colorClass: 'macro-pink' },
      ],
      streak: 1,
      streakDescKey: 'dashboard.streak_recovered_desc',
      streakDescParams: {},
      streakFooterKey: 'dashboard.streak_recovered_footer',
      streakFooterParams: {},
      streakClass: 'streak-recovered',
      weekDots: [false, false, false, false, false, false, true],
      todayIndex: 6,
      showNoMealsLoggedBlock: false,
      noMealsDays: 0,
    };
  }
}
