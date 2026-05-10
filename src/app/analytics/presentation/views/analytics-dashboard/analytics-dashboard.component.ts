import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnalyticsStore } from '../../../application/analytics.store';
import { IamStore } from '../../../../iam/application/iam.store';
import { AnalyticsPeriod } from '../../../domain/model/analytics-models';
import { MetricCardComponent } from '../../components/metric-card/metric-card.component';
import { PeriodToggleComponent } from '../../components/period-toggle/period-toggle.component';
import { ExportPdfButtonComponent } from '../../components/export-pdf-button/export-pdf-button.component';
import { DailyCaloriesChartComponent } from '../../components/daily-calories-chart/daily-calories-chart.component';
import { AverageMacrosPanelComponent } from '../../components/average-macros-panel/average-macros-panel.component';
import { WeightEvolutionChartComponent } from '../../components/weight-evolution-chart/weight-evolution-chart.component';
import { AdherenceHistoryTimelineComponent } from '../../components/adherence-history-timeline/adherence-history-timeline.component';
import { BehavioralEventsListComponent } from '../../components/behavioral-events-list/behavioral-events-list.component';
import { ExportPdfReportViewComponent } from '../export-pdf-report-view/export-pdf-report-view.component';
import { SubscriptionPlan } from '../../../../iam/domain/model/subscription-plan.enum';

@Component({
  selector: 'app-analytics-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MetricCardComponent,
    PeriodToggleComponent,
    ExportPdfButtonComponent,
    DailyCaloriesChartComponent,
    AverageMacrosPanelComponent,
    WeightEvolutionChartComponent,
    AdherenceHistoryTimelineComponent,
    BehavioralEventsListComponent,
    ExportPdfReportViewComponent,
  ],
  templateUrl: './analytics-dashboard.html',
  styleUrl: './analytics-dashboard.css',
})
export class AnalyticsDashboardComponent implements OnInit {
  protected readonly analyticsStore = inject(AnalyticsStore);
  protected readonly iamStore = inject(IamStore);

  protected readonly currentUser = this.iamStore.currentUser;
  protected readonly analyticsData = this.analyticsStore.currentAnalyticsData;
  protected readonly loading = this.analyticsStore.loading;
  protected readonly error = this.analyticsStore.error;
  protected readonly selectedPeriod = this.analyticsStore.selectedPeriod;

  // Flag to enable/disable preview mode
  protected previewMode = true; // Set to true for local preview without backend/auth

  // Signal to control the visibility of the Export PDF modal
  public _showExportPdfModal = signal<boolean>(false);
  public readonly showExportPdfModal = this._showExportPdfModal.asReadonly();

  // Computed signal to determine if the user is premium (for PDF export button)
  public readonly isPremiumUser = computed(() => this.iamStore.currentUser()?.plan === SubscriptionPlan.PREMIUM);

  // Computed signal for daily calories goal, handling potential empty history
  public readonly dailyCaloriesGoal = computed(() => {
    const data = this.analyticsData();
    return data?.dailyCaloriesHistory?.[0]?.goal ?? 1800;
  });

  // Computed signals for metric cards
  protected readonly averageCalorieIntakeVm = computed(() => {
    const data = this.analyticsData();
    return {
      label: 'AVERAGE CALORIE INTAKE',
      value: `${data?.averageCalorieIntake ?? 0} kcal`,
      description: '✓ Within target',
      statusClass: 'status-on-track',
    };
  });

  protected readonly averageProteinIntakeVm = computed(() => {
    const data = this.analyticsData();
    const protein = data?.macroAnalysis.find(m => m.name === 'Protein');
    const value = protein ? `${protein.consumed}g` : '0g';
    let description = '✓ On target';
    let statusClass = 'status-on-track';

    if (protein && protein.consumed < protein.target * 0.9) {
      description = '⚠ Below target';
      statusClass = 'status-at-risk';
    } else if (protein && protein.isAboveTarget) {
      description = '✓ Above target';
      statusClass = 'status-on-track';
    }

    return {
      label: 'AVERAGE PROTEIN INTAKE',
      value: value,
      description: description,
      statusClass: statusClass,
    };
  });

  protected readonly currentStreakVm = computed(() => {
    const data = this.analyticsData();
    return {
      label: 'CURRENT STREAK',
      value: `${data?.currentStreak ?? 0} days`,
      description: 'Consecutive days logged',
      statusClass: 'status-on-track',
    };
  });

  protected readonly weightChangeVm = computed(() => {
    const data = this.analyticsData();
    const change = data?.weightChange ?? 0;
    const direction = data?.weightChangeDirection;
    const status = data?.weightChangeStatus;

    let value = `${change > 0 ? '+' : ''}${change} kg`;
    let description = '';
    let statusClass = '';

    if (direction === 'down') {
      description = '▼ Down compared to last week';
      statusClass = status === 'positive' ? 'status-on-track' : 'status-at-risk';
    } else if (direction === 'up') {
      description = '▲ Up compared to last week';
      statusClass = status === 'positive' ? 'status-on-track' : 'status-at-risk';
    } else {
      description = '— No change this week';
      statusClass = 'status-neutral';
    }

    return {
      label: 'WEIGHT THIS WEEK',
      value: value,
      description: description,
      statusClass: statusClass,
    };
  });

  protected readonly showAdherenceHistory = computed(() => this.selectedPeriod() === '30_DAYS');

  ngOnInit(): void {
    if (this.previewMode) {
      // Load preview data for development without backend/authentication
      this.analyticsStore.loadPreviewData('7_DAYS', 'WEIGHT_LOSS');
    } else {
      // Original logic to load real data
      this.analyticsStore.loadAnalyticsData('7_DAYS').subscribe();
    }
  }

  onPeriodChange(period: AnalyticsPeriod): void {
    if (this.previewMode) {
      // Load preview data for the selected period
      this.analyticsStore.loadPreviewData(period, 'WEIGHT_LOSS'); // Assuming WEIGHT_LOSS for preview
    } else {
      // Original logic to load real data
      this.analyticsStore.loadAnalyticsData(period).subscribe();
    }
  }

  public onExportPdf(): void {
    this._showExportPdfModal.set(true);
  }

  public onCloseExportPdfModal(): void {
    this._showExportPdfModal.set(false);
  }

  public onReportGenerated(): void {
    this._showExportPdfModal.set(false);
    console.log('PDF report generation initiated successfully!');
  }
}
