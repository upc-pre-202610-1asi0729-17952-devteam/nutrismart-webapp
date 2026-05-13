import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { NgClass } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { DailyCaloriesHistory, AnalyticsPeriod } from '../../../domain/model/analytics-models';

@Component({
  selector: 'app-daily-calories-chart',
  standalone: true,
  imports: [NgClass, TranslateModule],
  templateUrl: './daily-calories-chart.component.html',
  styleUrl: './daily-calories-chart.component.css',
})
export class DailyCaloriesChartComponent implements OnChanges {
  @Input({ required: true }) dailyCaloriesHistory: DailyCaloriesHistory[] = [];
  @Input({ required: true }) goal: number = 0;
  @Input({ required: true }) period!: AnalyticsPeriod;

  chartData: { day: string; calories: number; status: 'over' | 'on-target' | 'no-data'; height: number; label: string }[] = [];
  maxCalories: number = 0;
  averageCalories: number = 0;

  private readonly weekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['dailyCaloriesHistory'] || changes['goal'] || changes['period']) {
      this.processChartData();
    }
  }

  private processChartData(): void {
    if (!this.dailyCaloriesHistory.length || this.goal === 0) {
      this.chartData = [];
      this.averageCalories = 0;
      this.maxCalories = 0;
      return;
    }

    const total = this.dailyCaloriesHistory.reduce((s, e) => s + e.calories, 0);
    const logged = this.dailyCaloriesHistory.filter(e => e.calories > 0).length;
    this.averageCalories = logged > 0 ? Math.round(total / logged) : 0;
    this.maxCalories = Math.max(this.goal * 1.2, ...this.dailyCaloriesHistory.map(d => d.calories));

    this.chartData = this.dailyCaloriesHistory.map((entry, index) => {
      const status: 'over' | 'on-target' | 'no-data' =
        entry.calories === 0 ? 'no-data'
        : entry.calories > this.goal ? 'over'
        : 'on-target';
      const height = (entry.calories / this.maxCalories) * 100;
      const day = this.period === '7_DAYS'
        ? this.weekDays[index % 7]
        : (index + 1).toString();
      return {
        day,
        calories: entry.calories,
        status,
        height,
        label: entry.calories > 0 ? entry.calories.toString() : '—',
      };
    });
  }
}
