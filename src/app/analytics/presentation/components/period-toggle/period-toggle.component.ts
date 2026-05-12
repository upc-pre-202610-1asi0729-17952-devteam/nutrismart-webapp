import { Component, EventEmitter, Input, Output } from '@angular/core';
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
  @Output() periodChange = new EventEmitter<AnalyticsPeriod>();

  readonly periods: { labelKey: string; value: AnalyticsPeriod }[] = [
    { labelKey: 'analytics.period_7_days',  value: '7_DAYS'  },
    { labelKey: 'analytics.period_30_days', value: '30_DAYS' },
    { labelKey: 'analytics.period_90_days', value: '90_DAYS' },
  ];

  onSelectPeriod(period: AnalyticsPeriod): void {
    this.periodChange.emit(period);
  }
}
