import { Component, computed, EventEmitter, Input, Output, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { AnalyticsPeriod } from '../../../domain/model/analytics-models';

@Component({
  selector: 'app-period-toggle',
  standalone: true,
  imports: [TranslateModule],
  templateUrl: './period-toggle.component.html',
  styleUrl: './period-toggle.component.css',
})
export class PeriodToggleComponent {
  @Input({ required: true }) selectedPeriod!: AnalyticsPeriod;
  /** Restricts visible periods; when omitted all three periods are shown. */
  @Input() allowedPeriods: AnalyticsPeriod[] = ['7_DAYS', '30_DAYS', '90_DAYS'];
  @Output() periodChange = new EventEmitter<AnalyticsPeriod>();

  readonly allPeriods: { labelKey: string; value: AnalyticsPeriod }[] = [
    { labelKey: 'analytics.period_7_days',  value: '7_DAYS'  },
    { labelKey: 'analytics.period_30_days', value: '30_DAYS' },
    { labelKey: 'analytics.period_90_days', value: '90_DAYS' },
  ];

  get periods() {
    return this.allPeriods.filter(p => this.allowedPeriods.includes(p.value));
  }

  onSelectPeriod(period: AnalyticsPeriod): void {
    this.periodChange.emit(period);
  }
}
