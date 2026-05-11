import { Component, computed, DestroyRef, inject, OnInit } from '@angular/core';
import { NgClass } from '@angular/common';
import { Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { IamStore } from '../../../../iam/application/iam.store';
import { BehavioralConsistencyStore } from '../../../application/behavioral-consistency.store';
import { NutritionStore } from '../../../../nutrition-tracking/application/nutrition.store';
import { AdherenceStatus } from '../../../domain/model/adherence-status.enum';
import { MealType } from '../../../../nutrition-tracking/domain/model/meal-type.enum';
import { MealRecord } from '../../../../nutrition-tracking/domain/model/meal-record.entity';

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

interface DonutArcVm {
  dasharray: string;
  dashoffset: string;
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
  imports: [NgClass, TranslatePipe],
  templateUrl: './behavioral-dashboard.html',
  styleUrl: './behavioral-dashboard.css',
})
export class BehavioralDashboard implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly translateService = inject(TranslateService);

  protected readonly iamStore = inject(IamStore);
  protected readonly behavioralStore = inject(BehavioralConsistencyStore);
  protected readonly nutritionStore = inject(NutritionStore);

  protected readonly currentUser = this.iamStore.currentUser;
  protected readonly currentProgress = this.behavioralStore.currentProgress;

  protected readonly isLoading = computed(() =>
    this.behavioralStore.loading() || this.nutritionStore.loading(),
  );

  protected readonly loadError = computed(() =>
    this.behavioralStore.error() ?? this.nutritionStore.error(),
  );

  protected readonly hasProgress = computed(() => this.currentProgress() !== null);

  private readonly activeLang = toSignal(
    this.translateService.onLangChange.pipe(map((e) => e.lang)),
    { initialValue: this.translateService.currentLang ?? 'en' },
  );

  protected readonly weekLabels = computed(() =>
    this.activeLang() === 'es'
      ? ['L', 'M', 'X', 'J', 'V', 'S', 'D']
      : ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
  );

  protected readonly dateLabel = computed(() => {
    const locale = this.activeLang() === 'es' ? 'es-ES' : 'en-US';
    return new Date().toLocaleDateString(locale, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  });

  protected readonly donutArcs = computed<{ protein: DonutArcVm; carbs: DonutArcVm; fat: DonutArcVm }>(() => {
    const circumference = 2 * Math.PI * 42;
    const totals = this.nutritionStore.dailyTotals();
    const proteinKcal = totals.protein * 4;
    const carbsKcal = totals.carbs * 4;
    const fatKcal = totals.fat * 9;
    const totalKcal = proteinKcal + carbsKcal + fatKcal;

    const empty = { dasharray: `0 ${circumference}`, dashoffset: '0' };
    if (totalKcal === 0) {
      return { protein: empty, carbs: empty, fat: empty };
    }

    const proteinArc = (proteinKcal / totalKcal) * circumference;
    const carbsArc = (carbsKcal / totalKcal) * circumference;
    const fatArc = (fatKcal / totalKcal) * circumference;

    return {
      protein: { dasharray: `${proteinArc} ${circumference}`, dashoffset: '0' },
      carbs: { dasharray: `${carbsArc} ${circumference}`, dashoffset: `${-proteinArc}` },
      fat: { dasharray: `${fatArc} ${circumference}`, dashoffset: `${-(proteinArc + carbsArc)}` },
    };
  });

  protected readonly dashboardVm = computed<DashboardVm>(() => {
    const progress = this.currentProgress();
    const status = progress?.adherenceStatus ?? AdherenceStatus.ON_TRACK;
    const streak = progress?.streak ?? 0;
    const consecutiveMisses = progress?.consecutiveMisses ?? 0;
    const weekDots = progress?.weekDots ?? [false, false, false, false, false, false, false];
    const todayIndex = (new Date().getDay() + 6) % 7;
    const streakMilestone = Math.ceil((streak + 1) / 7) * 7;

    const intake = this.nutritionStore.dailyIntake();
    const totals = this.nutritionStore.dailyTotals();
    const user = this.currentUser();
    const locale = this.activeLang() === 'es' ? 'es-ES' : 'en-US';

    const targetCalories = intake?.dailyGoal ?? user?.dailyCalorieTarget ?? 1800;
    const consumedCalories = Math.round(totals.calories);
    const activeCalories = intake?.active ?? 0;
    const remainingCalories = intake
      ? intake.remaining
      : targetCalories - consumedCalories;
    const progressPercent = intake
      ? intake.percentConsumed
      : Math.min(Math.round((consumedCalories / targetCalories) * 100), 100);
    const netBalance = consumedCalories - activeCalories;

    const proteinTarget = user?.proteinTarget ?? 120;
    const carbsTarget = user?.carbsTarget ?? 220;
    const fatTarget = user?.fatTarget ?? 65;

    return {
      status,
      greetingKey: status === AdherenceStatus.RECOVERED ? 'dashboard.greeting_back' : 'dashboard.greeting',
      greetingParams: { name: this.firstName },
      badgeLabelKey: this.badgeKeyFor(status),
      badgeLabelParams: this.badgeParamsFor(status, streak, consecutiveMisses),
      badgeClass: this.badgeClassFor(status),
      showAlert: status !== AdherenceStatus.ON_TRACK,
      ...this.alertVmFor(status, consecutiveMisses),
      consumedCalories,
      targetCalories,
      remainingCalories,
      netBalance,
      progressPercent,
      topAccentClass: this.accentFor(status),
      googleFitCalories: activeCalories > 0 ? activeCalories : null,
      meals: status === AdherenceStatus.DROPPED ? [] : this.buildMealsVm(locale),
      macros: [
        { nameKey: 'dashboard.macro_protein', consumed: Math.round(totals.protein), target: proteinTarget, colorClass: 'macro-teal' },
        { nameKey: 'dashboard.macro_carbs', consumed: Math.round(totals.carbs), target: carbsTarget, colorClass: 'macro-orange' },
        { nameKey: 'dashboard.macro_fat', consumed: Math.round(totals.fat), target: fatTarget, colorClass: 'macro-pink' },
      ],
      streak,
      ...this.streakVmFor(status, streak, consecutiveMisses, streakMilestone),
      weekDots,
      todayIndex,
      showNoMealsLoggedBlock: status === AdherenceStatus.DROPPED,
      noMealsDays: status === AdherenceStatus.DROPPED ? consecutiveMisses : 0,
    };
  });

  ngOnInit(): void {
    this.loadData();
  }

  protected onLogMeal(): void {
    void this.router.navigate(['/nutrition']);
  }

  protected onRetry(): void {
    this.loadData();
  }

  protected macroPercent(consumed: number, target: number): number {
    return Math.min(Math.round((consumed / target) * 100), 100);
  }

  private get firstName(): string {
    return this.currentUser()?.firstName ?? '';
  }

  private loadData(): void {
    const user = this.currentUser();
    if (!user) return;
    this.behavioralStore
      .ensureProgressForUser(user.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
    void this.nutritionStore.fetchMealEntries();
    void this.nutritionStore.fetchDailyBalance();
  }

  private buildMealsVm(locale: string): DashboardMealVm[] {
    const byType = this.nutritionStore.recordsByMealType();
    return [
      this.buildMealVm('dashboard.meal_breakfast', byType[MealType.BREAKFAST], 'dot-orange', locale),
      this.buildMealVm('dashboard.meal_lunch', byType[MealType.LUNCH], 'dot-teal', locale),
      this.buildMealVm('dashboard.meal_snack', byType[MealType.SNACK], 'dot-pink', locale),
      this.buildMealVm('dashboard.meal_dinner', byType[MealType.DINNER], 'dot-empty', locale),
    ];
  }

  private buildMealVm(nameKey: string, records: MealRecord[], dotClass: string, locale: string): DashboardMealVm {
    const todayRecords = records.filter((r) => r.isFromToday);
    if (todayRecords.length === 0) {
      return { nameKey, description: '', caloriesLabel: '— kcal', dotClass, notLogged: true, missed: false };
    }
    const totalKcal = todayRecords.reduce((sum, r) => sum + r.calories, 0);
    const foodName = todayRecords[0].foodItemName;
    const time = new Date(todayRecords[0].loggedAt).toLocaleTimeString(locale, {
      hour: 'numeric',
      minute: '2-digit',
      hour12: locale !== 'es-ES',
    });
    const description =
      todayRecords.length === 1
        ? `${foodName} · ${time}`
        : `${foodName} +${todayRecords.length - 1} more · ${time}`;
    return {
      nameKey,
      description,
      caloriesLabel: `${Math.round(totalKcal)} kcal`,
      dotClass,
      notLogged: false,
      missed: false,
    };
  }

  private badgeKeyFor(status: AdherenceStatus): string {
    switch (status) {
      case AdherenceStatus.AT_RISK: return 'dashboard.status_at_risk';
      case AdherenceStatus.DROPPED: return 'dashboard.status_dropped';
      case AdherenceStatus.RECOVERED: return 'dashboard.status_recovered';
      default: return 'dashboard.status_on_track';
    }
  }

  private badgeParamsFor(status: AdherenceStatus, streak: number, misses: number): Record<string, unknown> {
    switch (status) {
      case AdherenceStatus.AT_RISK: return { misses };
      case AdherenceStatus.DROPPED: return { days: misses };
      default: return { streak };
    }
  }

  private badgeClassFor(status: AdherenceStatus): string {
    switch (status) {
      case AdherenceStatus.AT_RISK: return 'status-at-risk';
      case AdherenceStatus.DROPPED: return 'status-dropped';
      case AdherenceStatus.RECOVERED: return 'status-recovered';
      default: return 'status-on-track';
    }
  }

  private accentFor(status: AdherenceStatus): string {
    switch (status) {
      case AdherenceStatus.AT_RISK: return 'accent-orange';
      case AdherenceStatus.DROPPED: return 'accent-red';
      case AdherenceStatus.RECOVERED: return 'accent-green';
      default: return 'accent-teal';
    }
  }

  private alertVmFor(
    status: AdherenceStatus,
    misses: number,
  ): Pick<DashboardVm, 'alertIcon' | 'alertTitleKey' | 'alertTitleParams' | 'alertDescKey' | 'alertBtnKey' | 'alertButtonClass'> {
    switch (status) {
      case AdherenceStatus.AT_RISK:
        return {
          alertIcon: '⚠️',
          alertTitleKey: 'dashboard.alert_at_risk_title',
          alertTitleParams: { days: misses },
          alertDescKey: 'dashboard.alert_at_risk_desc',
          alertBtnKey: 'dashboard.alert_at_risk_btn',
          alertButtonClass: 'risk-button-orange',
        };
      case AdherenceStatus.DROPPED:
        return {
          alertIcon: '💙',
          alertTitleKey: 'dashboard.alert_dropped_title',
          alertTitleParams: { days: misses },
          alertDescKey: 'dashboard.alert_dropped_desc',
          alertBtnKey: 'dashboard.alert_dropped_btn',
          alertButtonClass: 'risk-button-red',
        };
      case AdherenceStatus.RECOVERED:
        return {
          alertIcon: '🎉',
          alertTitleKey: 'dashboard.alert_recovered_title',
          alertTitleParams: {},
          alertDescKey: 'dashboard.alert_recovered_desc',
          alertBtnKey: 'dashboard.alert_recovered_btn',
          alertButtonClass: 'risk-button-green',
        };
      default:
        return {
          alertIcon: '',
          alertTitleKey: '',
          alertTitleParams: {},
          alertDescKey: '',
          alertBtnKey: '',
          alertButtonClass: '',
        };
    }
  }

  private streakVmFor(
    status: AdherenceStatus,
    streak: number,
    misses: number,
    milestone: number,
  ): Pick<DashboardVm, 'streakDescKey' | 'streakDescParams' | 'streakFooterKey' | 'streakFooterParams' | 'streakClass'> {
    switch (status) {
      case AdherenceStatus.AT_RISK:
        return {
          streakDescKey: 'dashboard.streak_at_risk_desc',
          streakDescParams: { misses },
          streakFooterKey: 'dashboard.streak_at_risk_footer',
          streakFooterParams: {},
          streakClass: 'streak-at-risk',
        };
      case AdherenceStatus.DROPPED:
        return {
          streakDescKey: 'dashboard.streak_dropped_desc',
          streakDescParams: { days: misses },
          streakFooterKey: 'dashboard.streak_dropped_footer',
          streakFooterParams: {},
          streakClass: 'streak-dropped',
        };
      case AdherenceStatus.RECOVERED:
        return {
          streakDescKey: 'dashboard.streak_recovered_desc',
          streakDescParams: {},
          streakFooterKey: 'dashboard.streak_recovered_footer',
          streakFooterParams: {},
          streakClass: 'streak-recovered',
        };
      default:
        return {
          streakDescKey: 'dashboard.streak_on_track_desc',
          streakDescParams: {},
          streakFooterKey: 'dashboard.streak_on_track_footer',
          streakFooterParams: { days: milestone },
          streakClass: 'streak-on-track',
        };
    }
  }
}
