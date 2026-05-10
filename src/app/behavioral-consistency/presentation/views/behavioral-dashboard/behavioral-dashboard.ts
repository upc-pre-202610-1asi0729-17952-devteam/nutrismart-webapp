import { Component, computed, inject, OnInit } from '@angular/core';
import { NgClass } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { IamStore } from '../../../../iam/application/iam.store';
import { BehavioralConsistencyStore } from '../../../application/behavioral-consistency.store';
import { AdherenceStatus } from '../../../domain/model/adherence-status.enum';

interface DashboardMealVm {
  name: string;
  description: string;
  caloriesLabel: string;
  dotClass: string;
  missed?: boolean;
  missedBadge?: string;
}

interface DashboardMacroVm {
  name: string;
  consumed: number;
  target: number;
  colorClass: string;
}

interface DashboardVm {
  status: AdherenceStatus;
  greeting: string;
  dateLabel: string;
  badgeLabel: string;
  badgeClass: string;
  showAlert: boolean;
  alertIcon: string; // Added
  alertTitle: string;
  alertDescription: string;
  alertButton: string;
  alertButtonClass: string; // Added
  consumedCalories: number;
  targetCalories: number;
  remainingCalories: number;
  netBalance: number;
  progressPercent: number;
  topAccentClass: string;
  googleFitBadge: string | null;
  netBalanceSubtitle: string;
  meals: DashboardMealVm[];
  macros: DashboardMacroVm[];
  streak: number;
  streakDescription: string;
  streakFooter: string;
  streakClass: string;
  weekDots: boolean[];
  todayIndex: number;
  showNoMealsLoggedBlock?: boolean; // New property for DROPPED state
}

/**
 * Main dashboard view for the Behavioral Consistency bounded context.
 *
 * Renders the behavioral consistency dashboard using a UI view model derived
 * from the current adherence status.
 */
@Component({
  selector: 'app-behavioral-dashboard',
  imports: [NgClass, MatIconModule],
  templateUrl: './behavioral-dashboard.html',
  styleUrl: './behavioral-dashboard.css',
})
export class BehavioralDashboard implements OnInit {
  /** IAM store exposing the authenticated user. */
  protected readonly iamStore = inject(IamStore);

  /** Behavioral consistency store exposing progress state and actions. */
  protected readonly behavioralStore = inject(BehavioralConsistencyStore);

  /** Whether this dashboard should run without backend/authentication. */
  private readonly previewMode = true;

  /** Current authenticated user. */
  protected readonly currentUser = this.iamStore.currentUser;

  /** Current behavioral progress. */
  protected readonly currentProgress = this.behavioralStore.currentProgress;

  /** Latest error message. */
  protected readonly error = this.behavioralStore.error;

  /** Whether there is behavioral progress ready to render. */
  protected readonly hasProgress = computed(() => this.currentProgress() !== null);

  /** Week day labels used by the streak card. */
  protected readonly weekLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  /** Dashboard view model used by the template. */
  protected readonly dashboardVm = computed<DashboardVm>(() => {
    const status = this.currentProgress()?.adherenceStatus ?? AdherenceStatus.ON_TRACK;

    if (status === AdherenceStatus.AT_RISK) {
      return this.buildAtRiskVm();
    } else if (status === AdherenceStatus.DROPPED) {
      return this.buildDroppedVm();
    } else if (status === AdherenceStatus.RECOVERED) {
      return this.buildRecoveredVm();
    }

    return this.buildOnTrackVm();
  });

  /**
   * Loads local preview progress while the dashboard is being developed.
   */
  ngOnInit(): void {
    if (this.previewMode) {
      this.behavioralStore.loadPreviewProgress();
      return;
    }
  }

  /**
   * Marks today's behavioral goal as completed.
   */
  protected onGoalMet(): void {
    this.behavioralStore.markGoalMet();
  }

  /**
   * Marks today's behavioral goal as missed.
   */
  protected onGoalMissed(): void {
    this.behavioralStore.markGoalMissed();
  }

  /**
   * Reloads preview data.
   */
  protected onRefreshRequested(): void {
    this.behavioralStore.loadPreviewProgress();
  }

  /**
   * Calculates a percentage for macro mini-bars.
   *
   * @param consumed - Consumed macro amount.
   * @param target - Target macro amount.
   * @returns Percentage capped at 100.
   */
  protected macroPercent(consumed: number, target: number): number {
    return Math.min(Math.round((consumed / target) * 100), 100);
  }

  /**
   * Builds the ON_TRACK dashboard state.
   *
   * @returns Dashboard view model for ON_TRACK.
   */
  private buildOnTrackVm(): DashboardVm {
    return {
      status: AdherenceStatus.ON_TRACK,
      greeting: `Good morning, ${this.currentUser()?.firstName ?? 'Ana'}`,
      dateLabel: 'Thursday, 7 May 2026',
      badgeLabel: '✓ ON_TRACK · Streak 5',
      badgeClass: 'status-on-track',
      showAlert: false,
      alertIcon: '', // Added
      alertTitle: '',
      alertDescription: '',
      alertButton: '',
      alertButtonClass: '', // Added
      consumedCalories: 1340,
      targetCalories: 1800,
      remainingCalories: 460,
      netBalance: 1040,
      progressPercent: 74,
      topAccentClass: 'accent-teal',
      googleFitBadge: '🏃 −300 Google Fit',
      netBalanceSubtitle: '',
      meals: [
        {
          name: 'Breakfast',
          description: 'Oatmeal + banana · 7:30 am',
          caloriesLabel: '380 kcal',
          dotClass: 'dot-orange',
        },
        {
          name: 'Lunch',
          description: 'Rice + chicken + salad · 1:00 pm',
          caloriesLabel: '720 kcal',
          dotClass: 'dot-teal',
        },
        {
          name: 'Snack',
          description: 'Greek yoghurt · 4:00 pm',
          caloriesLabel: '240 kcal',
          dotClass: 'dot-pink',
        },
        {
          name: 'Dinner',
          description: 'Not yet logged',
          caloriesLabel: '— kcal',
          dotClass: 'dot-empty',
        },
      ],
      macros: [
        {
          name: 'Protein',
          consumed: 82,
          target: 120,
          colorClass: 'macro-teal',
        },
        {
          name: 'Carbohydrates',
          consumed: 165,
          target: 220,
          colorClass: 'macro-orange',
        },
        {
          name: 'Fat',
          consumed: 42,
          target: 65,
          colorClass: 'macro-pink',
        },
      ],
      streak: 5,
      streakDescription: 'consecutive days with a full log',
      streakFooter: 'Next milestone: 7 days 🔥',
      streakClass: 'streak-on-track',
      weekDots: [true, true, true, true, true, false, false],
      todayIndex: 4,
    };
  }

  /**
   * Builds the AT_RISK dashboard state.
   *
   * @returns Dashboard view model for AT_RISK.
   */
  private buildAtRiskVm(): DashboardVm {
    return {
      status: AdherenceStatus.AT_RISK,
      greeting: `Good morning, ${this.currentUser()?.firstName ?? 'Ana'}`,
      dateLabel: 'Thursday, 7 May 2026',
      badgeLabel: '⚠ AT_RISK · 3 misses',
      badgeClass: 'status-at-risk',
      showAlert: true,
      alertIcon: '⚠️', // Added
      alertTitle: `You've been off track for 3 days`,
      alertDescription: 'AdherenceStatus: AT_RISK · BehavioralDropDetected emitted · Preventive recommendation generated.',
      alertButton: 'See suggestion →',
      alertButtonClass: 'risk-button-orange', // Added
      consumedCalories: 310,
      targetCalories: 1800,
      remainingCalories: 1490,
      netBalance: 1490,
      progressPercent: 17,
      topAccentClass: 'accent-orange',
      googleFitBadge: null,
      netBalanceSubtitle: 'No activity synced',
      meals: [
        {
          name: 'Breakfast',
          description: 'Oatmeal + banana · 7:30 am',
          caloriesLabel: '310 kcal',
          dotClass: 'dot-orange',
        },
        {
          name: 'Lunch',
          description: 'Not logged · MealSkipped emitted',
          caloriesLabel: '— kcal',
          dotClass: 'dot-danger',
          missed: true,
          missedBadge: 'Missed window · MealSkipped emitted',
        },
        {
          name: 'Snack',
          description: 'Not logged · MealSkipped emitted',
          caloriesLabel: '— kcal',
          dotClass: 'dot-danger',
          missed: true,
          missedBadge: 'Missed window',
        },
        {
          name: 'Dinner',
          description: 'Not yet logged',
          caloriesLabel: '— kcal',
          dotClass: 'dot-empty',
        },
      ],
      macros: [
        {
          name: 'Protein',
          consumed: 18,
          target: 120,
          colorClass: 'macro-teal',
        },
        {
          name: 'Carbohydrates',
          consumed: 38,
          target: 220,
          colorClass: 'macro-orange',
        },
        {
          name: 'Fat',
          consumed: 9,
          target: 65,
          colorClass: 'macro-pink',
        },
      ],
      streak: 0,
      streakDescription: 'streak broken — 3 consecutive misses',
      streakFooter: 'AdherenceStatus: AT_RISK',
      streakClass: 'streak-at-risk',
      weekDots: [true, false, false, false, false, false, false],
      todayIndex: 4,
    };
  }

  /**
   * Builds the DROPPED dashboard state.
   *
   * @returns Dashboard view model for DROPPED.
   */
  private buildDroppedVm(): DashboardVm {
    const targetCalories = 1800; // Assuming a default target
    return {
      status: AdherenceStatus.DROPPED,
      greeting: `Good morning, ${this.currentUser()?.firstName ?? 'Ana'}`,
      dateLabel: 'Thursday, 7 May 2026',
      badgeLabel: '✗ DROPPED · 7 days',
      badgeClass: 'status-dropped',
      showAlert: true,
      alertIcon: '💙', // Added
      alertTitle: `We've missed you — 7 days inactive`,
      alertDescription: 'AdherenceStatus: DROPPED · NutritionalAbandonmentRisk emitted · Reactivation plan ready.',
      alertButton: 'See reactivation plan →',
      alertButtonClass: 'risk-button-red', // Added
      consumedCalories: 0,
      targetCalories: targetCalories,
      remainingCalories: targetCalories,
      netBalance: targetCalories,
      progressPercent: 0,
      topAccentClass: 'accent-red',
      googleFitBadge: null,
      netBalanceSubtitle: '',
      meals: [], // No meals logged
      showNoMealsLoggedBlock: true, // Show the "No meals logged" block
      macros: [
        {
          name: 'Protein',
          consumed: 0,
          target: 120,
          colorClass: 'macro-teal',
        },
        {
          name: 'Carbohydrates',
          consumed: 0,
          target: 220,
          colorClass: 'macro-orange',
        },
        {
          name: 'Fat',
          consumed: 0,
          target: 65,
          colorClass: 'macro-pink',
        },
      ],
      streak: 0,
      streakDescription: '7 days inactive — NutritionalAbandonmentRisk',
      streakFooter: 'AdherenceStatus: DROPPED',
      streakClass: 'streak-dropped',
      weekDots: [false, false, false, false, false, false, false], // All empty
      todayIndex: -1, // Not relevant or default
    };
  }

  /**
   * Builds the RECOVERED dashboard state.
   *
   * @returns Dashboard view model for RECOVERED.
   */
  private buildRecoveredVm(): DashboardVm {
    const targetCalories = 1800; // Assuming a default target
    const consumedCalories = 480;
    const remainingCalories = targetCalories - consumedCalories;
    return {
      status: AdherenceStatus.RECOVERED,
      greeting: `Welcome back! 🎉`,
      dateLabel: 'Thursday, 7 May 2026',
      badgeLabel: '↩ RECOVERED · Day 1',
      badgeClass: 'status-recovered',
      showAlert: true,
      alertIcon: '🎉', // Added
      alertTitle: `Welcome back! Consistency recovered.`,
      alertDescription: 'ConsistencyRecovered event emitted · AdherenceStatus: RECOVERED → ON_TRACK · Streak restarted.',
      alertButton: 'Keep going →',
      alertButtonClass: 'risk-button-green', // Added
      consumedCalories: consumedCalories,
      targetCalories: targetCalories,
      remainingCalories: remainingCalories,
      netBalance: 0, // Assuming 0 as per description "sin Google Fit"
      progressPercent: Math.round((consumedCalories / targetCalories) * 100),
      topAccentClass: 'accent-green',
      googleFitBadge: null,
      netBalanceSubtitle: '',
      meals: [
        {
          name: 'Breakfast',
          description: 'Oatmeal + banana · 7:30 am',
          caloriesLabel: '480 kcal', // Adjusted to match consumedCalories
          dotClass: 'dot-orange',
        },
        {
          name: 'Lunch',
          description: 'Not yet logged',
          caloriesLabel: '— kcal',
          dotClass: 'dot-empty',
        },
        {
          name: 'Snack',
          description: 'Not yet logged',
          caloriesLabel: '— kcal',
          dotClass: 'dot-empty',
        },
        {
          name: 'Dinner',
          description: 'Not yet logged',
          caloriesLabel: '— kcal',
          dotClass: 'dot-empty',
        },
      ],
      macros: [
        {
          name: 'Protein',
          consumed: Math.round(480 * 0.2 / 4), // Example distribution
          target: 120,
          colorClass: 'macro-teal',
        },
        {
          name: 'Carbohydrates',
          consumed: Math.round(480 * 0.5 / 4),
          target: 220,
          colorClass: 'macro-orange',
        },
        {
          name: 'Fat',
          consumed: Math.round(480 * 0.3 / 9),
          target: 65,
          colorClass: 'macro-pink',
        },
      ],
      streak: 1,
      streakDescription: 'recovery streak started — keep going!',
      streakFooter: 'ConsistencyRecovered ✓',
      streakClass: 'streak-recovered',
      weekDots: [false, false, false, false, false, false, true], // Only Sunday (last day) with dot
      todayIndex: 6, // Sunday
    };
  }
}
