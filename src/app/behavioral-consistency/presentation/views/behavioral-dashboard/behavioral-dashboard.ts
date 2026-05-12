import { Component, computed, DestroyRef, inject, OnInit } from '@angular/core';
import { NgClass } from '@angular/common';
import { Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { IamStore } from '../../../../iam/application/iam.store';
import { BehavioralConsistencyStore } from '../../../application/behavioral-consistency.store';
import { NutritionStore } from '../../../../nutrition-tracking/application/nutrition.store';
import { WearableStore } from '../../../../metabolic-adaptation/application/wearable.store';
import { MacroWarningBanner } from '../../../../shared/presentation/components/macro-warning-banner/macro-warning-banner';
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

interface GreetingVm {
  greetingKey: string;
  greetingParams: Record<string, unknown>;
  badgeLabelKey: string;
  badgeLabelParams: Record<string, unknown>;
  badgeClass: string;
  topAccentClass: string;
}

interface AlertVm {
  show: boolean;
  icon: string;
  titleKey: string;
  titleParams: Record<string, unknown>;
  descKey: string;
  btnKey: string;
  btnClass: string;
}

interface CaloriesVm {
  consumed: number;
  target: number;
  remaining: number;
  netBalance: number;
  progressPercent: number;
  googleFitCalories: number | null;
}

interface MealsVm {
  meals: DashboardMealVm[];
  showNoMealsLoggedBlock: boolean;
  noMealsDays: number;
}

interface MacrosVm {
  macros: DashboardMacroVm[];
}

interface StreakVm {
  streak: number;
  descKey: string;
  descParams: Record<string, unknown>;
  footerKey: string;
  footerParams: Record<string, unknown>;
  streakClass: string;
  weekDots: boolean[];
  todayIndex: number;
  weeklyCompletionRate: number;
}

@Component({
  selector: 'app-behavioral-dashboard',
  imports: [NgClass, TranslatePipe, MacroWarningBanner],
  templateUrl: './behavioral-dashboard.html',
  styleUrl: './behavioral-dashboard.css',
})
export class BehavioralDashboard implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly translateService = inject(TranslateService);

  private readonly iamStore = inject(IamStore);
  private readonly behavioralStore = inject(BehavioralConsistencyStore);
  private readonly nutritionStore = inject(NutritionStore);
  private readonly wearableStore = inject(WearableStore);

  private readonly currentUser = this.iamStore.currentUser;
  private readonly currentProgress = this.behavioralStore.currentProgress;

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

  private readonly status = computed(() =>
    this.currentProgress()?.adherenceStatus ?? AdherenceStatus.ON_TRACK,
  );

  private readonly streak = computed(() => this.currentProgress()?.streak ?? 0);

  private readonly consecutiveMisses = computed(() =>
    this.currentProgress()?.consecutiveMisses ?? 0,
  );

  protected readonly greetingVm = computed<GreetingVm>(() => {
    const status = this.status();
    const streak = this.streak();
    const misses = this.consecutiveMisses();
    return {
      greetingKey: 'dashboard.greeting',
      greetingParams: { name: this.firstName },
      badgeLabelKey: this.badgeKeyFor(status),
      badgeLabelParams: this.badgeParamsFor(status, streak, misses),
      badgeClass: this.badgeClassFor(status),
      topAccentClass: this.accentFor(status),
    };
  });

  protected readonly alertVm = computed<AlertVm>(() => {
    const status = this.status();
    const misses = this.consecutiveMisses();
    const progress = this.currentProgress();
    const show = progress?.hasAlert() ?? status !== AdherenceStatus.ON_TRACK;
    return { show, ...this.alertVmFor(status, misses) };
  });

  protected readonly caloriesVm = computed<CaloriesVm>(() => {
    const intake = this.nutritionStore.getDailyIntakeFor(new Date());
    const totals = this.nutritionStore.dailyTotals();
    const user = this.currentUser();
    const targetCalories = intake?.dailyGoal ?? user?.dailyCalorieTarget ?? 1800;
    const consumedCalories = Math.round(totals.calories);
    const activeCalories = this.wearableStore.netCalorieAdjustment();
    const net = targetCalories + activeCalories;
    const remainingCalories = net - consumedCalories;
    const progressPercent = net > 0 ? Math.min(Math.round((consumedCalories / net) * 100), 100) : 0;
    return {
      consumed: consumedCalories,
      target: targetCalories,
      remaining: remainingCalories,
      netBalance: consumedCalories - activeCalories,
      progressPercent,
      googleFitCalories: activeCalories > 0 ? activeCalories : null,
    };
  });

  protected readonly mealsVm = computed<MealsVm>(() => {
    const status = this.status();
    const misses = this.consecutiveMisses();
    const locale = this.activeLang() === 'es' ? 'es-ES' : 'en-US';
    return {
      meals: status === AdherenceStatus.DROPPED ? [] : this.buildMealsVm(locale),
      showNoMealsLoggedBlock: status === AdherenceStatus.DROPPED,
      noMealsDays: status === AdherenceStatus.DROPPED ? misses : 0,
    };
  });

  protected readonly macrosVm = computed<MacrosVm>(() => {
    const totals = this.nutritionStore.dailyTotals();
    const user = this.currentUser();
    return {
      macros: [
        { nameKey: 'dashboard.macro_protein', consumed: Math.round(totals.protein), target: user?.proteinTarget ?? 120, colorClass: 'macro-teal' },
        { nameKey: 'dashboard.macro_carbs', consumed: Math.round(totals.carbs), target: user?.carbsTarget ?? 220, colorClass: 'macro-orange' },
        { nameKey: 'dashboard.macro_fat', consumed: Math.round(totals.fat), target: user?.fatTarget ?? 65, colorClass: 'macro-pink' },
      ],
    };
  });

  protected readonly streakVm = computed<StreakVm>(() => {
    const status = this.status();
    const streak = this.streak();
    const misses = this.consecutiveMisses();
    const progress = this.currentProgress();
    const milestone = progress?.nextStreakMilestone ?? Math.ceil((streak + 1) / 7) * 7;
    return {
      streak,
      ...this.streakVmFor(status, streak, misses, milestone),
      weekDots: progress?.weekDots ?? [false, false, false, false, false, false, false],
      todayIndex: (new Date().getDay() + 6) % 7,
      weeklyCompletionRate: progress?.weeklyCompletionRate ?? 0,
    };
  });

  private readonly macroProgress = computed(() => {
    const totals = this.nutritionStore.dailyTotals();
    const u = this.currentUser();
    const calories = this.caloriesVm();
    return [
      { key: 'nutrition.calories',      pct: calories.target > 0 ? (calories.consumed / calories.target) * 100 : 0 },
      { key: 'nutrition.protein',       pct: (u?.proteinTarget ?? 120) > 0 ? (Math.round(totals.protein) / (u?.proteinTarget ?? 120)) * 100 : 0 },
      { key: 'nutrition.carbohydrates', pct: (u?.carbsTarget   ?? 220) > 0 ? (Math.round(totals.carbs)   / (u?.carbsTarget   ?? 220)) * 100 : 0 },
      { key: 'nutrition.fats',          pct: (u?.fatTarget     ?? 65)  > 0 ? (Math.round(totals.fat)     / (u?.fatTarget     ?? 65))  * 100 : 0 },
      { key: 'nutrition.fiber',         pct: (u?.fiberTarget   ?? 25)  > 0 ? (Math.round(totals.fiber ?? 0) / (u?.fiberTarget ?? 25)) * 100 : 0 },
    ];
  });

  /** i18n keys of macros between 80% and 99% of their daily target. */
  protected readonly approachingMacros = computed(() =>
    this.macroProgress().filter(m => m.pct >= 80 && m.pct < 100).map(m => m.key),
  );

  /** i18n keys of macros at or above 100% of their daily target. */
  protected readonly exceededMacros = computed(() =>
    this.macroProgress().filter(m => m.pct >= 100).map(m => m.key),
  );

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
    void this.nutritionStore.loadMealHistory();
    void this.nutritionStore.loadDailyBalance();
    void this.wearableStore.load();
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
    const more = todayRecords.length > 1
      ? ' ' + this.translateService.instant('dashboard.meal_more', { count: todayRecords.length - 1 })
      : '';
    const description = `${foodName}${more} · ${time}`;
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
      default: return 'status-on-track';
    }
  }

  private accentFor(status: AdherenceStatus): string {
    switch (status) {
      case AdherenceStatus.AT_RISK: return 'accent-orange';
      case AdherenceStatus.DROPPED: return 'accent-red';
      default: return 'accent-teal';
    }
  }

  private alertVmFor(
    status: AdherenceStatus,
    misses: number,
  ): Omit<AlertVm, 'show'> {
    switch (status) {
      case AdherenceStatus.AT_RISK:
        return {
          icon: '⚠️',
          titleKey: 'dashboard.alert_at_risk_title',
          titleParams: { days: misses },
          descKey: 'dashboard.alert_at_risk_desc',
          btnKey: 'dashboard.alert_at_risk_btn',
          btnClass: 'risk-button-orange',
        };
      case AdherenceStatus.DROPPED:
        return {
          icon: '💙',
          titleKey: 'dashboard.alert_dropped_title',
          titleParams: { days: misses },
          descKey: 'dashboard.alert_dropped_desc',
          btnKey: 'dashboard.alert_dropped_btn',
          btnClass: 'risk-button-red',
        };
      default:
        return {
          icon: '',
          titleKey: '',
          titleParams: {},
          descKey: '',
          btnKey: '',
          btnClass: '',
        };
    }
  }

  private streakVmFor(
    status: AdherenceStatus,
    streak: number,
    misses: number,
    milestone: number,
  ): Pick<StreakVm, 'descKey' | 'descParams' | 'footerKey' | 'footerParams' | 'streakClass'> {
    switch (status) {
      case AdherenceStatus.AT_RISK:
        return {
          descKey: 'dashboard.streak_at_risk_desc',
          descParams: { misses },
          footerKey: 'dashboard.streak_at_risk_footer',
          footerParams: {},
          streakClass: 'streak-at-risk',
        };
      case AdherenceStatus.DROPPED:
        return {
          descKey: 'dashboard.streak_dropped_desc',
          descParams: { days: misses },
          footerKey: 'dashboard.streak_dropped_footer',
          footerParams: {},
          streakClass: 'streak-dropped',
        };
      default:
        return {
          descKey: 'dashboard.streak_on_track_desc',
          descParams: {},
          footerKey: 'dashboard.streak_on_track_footer',
          footerParams: { days: milestone },
          streakClass: 'streak-on-track',
        };
    }
  }
}
