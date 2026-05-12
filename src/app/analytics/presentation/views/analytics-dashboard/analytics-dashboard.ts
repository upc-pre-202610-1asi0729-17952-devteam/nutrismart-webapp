import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
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
import { ExportPdfReportViewComponent, ExportPdfRequest } from '../export-pdf-report-view/export-pdf-report-view.component';
import { SubscriptionPlan } from '../../../../iam/domain/model/subscription-plan.enum';

@Component({
  selector: 'app-analytics-dashboard',
  standalone: true,
  imports: [
    TranslateModule,
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
  private readonly translate = inject(TranslateService);

  protected readonly analyticsData = this.analyticsStore.currentAnalyticsData;
  protected readonly loading = this.analyticsStore.loading;
  protected readonly error = this.analyticsStore.error;
  protected readonly selectedPeriod = this.analyticsStore.selectedPeriod;

  private readonly _showExportPdfModal = signal<boolean>(false);
  readonly showExportPdfModal = this._showExportPdfModal.asReadonly();

  readonly isPremiumUser = computed(() =>
    this.iamStore.currentUser()?.plan === SubscriptionPlan.PREMIUM
  );

  readonly dailyCaloriesGoal = computed(() =>
    this.analyticsData()?.dailyCaloriesHistory?.[0]?.goal ?? 1800
  );

  readonly showAdherenceHistory = computed(() =>
    this.selectedPeriod() !== '7_DAYS'
  );

  readonly averageCalorieIntakeVm = computed(() => {
    const data = this.analyticsData();
    const avg = data?.averageCalorieIntake ?? 0;
    const goal = this.dailyCaloriesGoal();
    const isOver = avg > goal;
    return {
      label: this.translate.instant('analytics.metric_avg_calories_label'),
      value: `${avg} kcal`,
      description: this.translate.instant(
        isOver ? 'analytics.metric_avg_calories_at_risk' : 'analytics.metric_avg_calories_on_track'
      ),
      statusClass: isOver ? 'status-at-risk' : 'status-on-track',
    };
  });

  readonly averageProteinIntakeVm = computed(() => {
    const data = this.analyticsData();
    const protein = data?.macroAnalysis.find(m => m.name === 'Protein');
    const consumed = protein?.consumed ?? 0;
    const target = protein?.target ?? 1;
    const ratio = consumed / target;
    let descKey: string;
    let statusClass: string;
    if (protein?.isAboveTarget || ratio >= 1) {
      descKey = 'analytics.metric_avg_protein_above';
      statusClass = 'status-on-track';
    } else if (ratio < 0.9) {
      descKey = 'analytics.metric_avg_protein_below';
      statusClass = 'status-at-risk';
    } else {
      descKey = 'analytics.metric_avg_protein_on_track';
      statusClass = 'status-on-track';
    }
    return {
      label: this.translate.instant('analytics.metric_avg_protein_label'),
      value: protein ? `${consumed}g` : '0g',
      description: this.translate.instant(descKey),
      statusClass,
    };
  });

  readonly currentStreakVm = computed(() => ({
    label: this.translate.instant('analytics.metric_streak_label'),
    value: `${this.analyticsData()?.currentStreak ?? 0} días`,
    description: this.translate.instant('analytics.metric_streak_description'),
    statusClass: 'status-on-track',
  }));

  readonly weightChangeVm = computed(() => {
    const data = this.analyticsData();
    const change = data?.weightChange ?? 0;
    const direction = data?.weightChangeDirection ?? 'none';
    const status = data?.weightChangeStatus ?? 'neutral';
    const sign = change > 0 ? '+' : '';
    let descKey: string;
    if (direction === 'down') descKey = 'analytics.metric_weight_down';
    else if (direction === 'up') descKey = 'analytics.metric_weight_up';
    else descKey = 'analytics.metric_weight_none';
    return {
      label: this.translate.instant('analytics.metric_weight_label'),
      value: `${sign}${change} kg`,
      description: this.translate.instant(descKey),
      statusClass: status === 'positive' ? 'status-on-track'
        : status === 'negative' ? 'status-at-risk'
        : 'status-neutral',
    };
  });

  ngOnInit(): void {
    this.analyticsStore.loadAnalyticsData('7_DAYS').subscribe();
  }

  onPeriodChange(period: AnalyticsPeriod): void {
    this.analyticsStore.loadAnalyticsData(period).subscribe();
  }

  onExportPdf(): void {
    this._showExportPdfModal.set(true);
  }

  onCloseExportPdfModal(): void {
    this._showExportPdfModal.set(false);
  }

  onExportRequest(req: ExportPdfRequest): void {
    this.analyticsStore.exportReport(req.fromDate, req.toDate).subscribe({
      next: () => this._showExportPdfModal.set(false),
      error: () => {},
    });
  }
}
