import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { AnalyticsPeriod } from '../../../domain/model/analytics-models';

@Component({
  selector: 'app-period-toggle',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './period-toggle.component.html',
  styleUrl: './period-toggle.component.css',
})
export class PeriodToggleComponent {
  @Input({ required: true }) selectedPeriod!: AnalyticsPeriod;
  @Output() periodChange = new EventEmitter<AnalyticsPeriod>();

  periods: { label: string; value: AnalyticsPeriod }[] = [
    { label: '7 days', value: '7_DAYS' },
    { label: '30 days', value: '30_DAYS' },
    { label: '90 days', value: '90_DAYS' },
  ];

  onSelectPeriod(period: AnalyticsPeriod): void {
    this.periodChange.emit(period);
  }
}
