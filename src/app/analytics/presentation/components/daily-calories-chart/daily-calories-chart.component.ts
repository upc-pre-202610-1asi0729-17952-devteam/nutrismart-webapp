import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DailyCaloriesHistory, AnalyticsPeriod } from '../../../domain/model/analytics-models';

@Component({
  selector: 'app-daily-calories-chart',
  standalone: true,
  imports: [CommonModule],
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

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['dailyCaloriesHistory'] || changes['goal'] || changes['period']) {
      this.processChartData();
    }
  }

  private processChartData(): void {
    if (!this.dailyCaloriesHistory || this.dailyCaloriesHistory.length === 0 || this.goal === 0) {
      this.chartData = [];
      this.averageCalories = 0;
      this.maxCalories = 0;
      return;
    }

    const daysOfWeek = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    const totalCalories = this.dailyCaloriesHistory.reduce((sum, entry) => sum + entry.calories, 0);
    const loggedDays = this.dailyCaloriesHistory.filter(entry => entry.calories > 0).length;
    this.averageCalories = loggedDays > 0 ? Math.round(totalCalories / loggedDays) : 0;

    // Determine max calories for scaling, including the goal
    this.maxCalories = Math.max(this.goal * 1.2, ...this.dailyCaloriesHistory.map(d => d.calories)); // 20% buffer above goal

    this.chartData = this.dailyCaloriesHistory.map((entry, index) => {
      const status: 'over' | 'on-target' | 'no-data' =
        entry.calories === 0
          ? 'no-data'
          : entry.calories > this.goal
            ? 'over'
            : 'on-target';

      const height = (entry.calories / this.maxCalories) * 100;
      const dayLabel = this.period === '7_DAYS' ? daysOfWeek[index % 7] : (index + 1).toString(); // Simple day label for now

      return {
        day: dayLabel,
        calories: entry.calories,
        status: status,
        height: height,
        label: entry.calories > 0 ? entry.calories.toString() : '—',
      };
    });
  }
}
