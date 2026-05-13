import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-weight-evolution-chart',
  standalone: true,
  imports: [TranslateModule],
  templateUrl: './weight-evolution-chart.component.html',
  styleUrl: './weight-evolution-chart.component.css',
})
export class WeightEvolutionChartComponent implements OnChanges {
  @Input({ required: true }) weightEvolution: { date: string; weight: number }[] = [];
  @Input() goalWeight: number | undefined;

  chartPoints: { x: number; y: number; date: string; weight: number }[] = [];
  goalLineY: number | undefined;
  minWeight: number = 0;
  maxWeight: number = 0;
  minDate: Date | undefined;
  maxDate: Date | undefined;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['weightEvolution'] || changes['goalWeight']) {
      this.processChartData();
    }
  }

  private processChartData(): void {
    if (!this.weightEvolution || this.weightEvolution.length < 2) {
      this.chartPoints = [];
      this.goalLineY = undefined;
      return;
    }

    const weights = this.weightEvolution.map(e => e.weight);
    if (this.goalWeight !== undefined) weights.push(this.goalWeight);

    this.minWeight = Math.min(...weights) - 2;
    this.maxWeight = Math.max(...weights) + 2;
    this.minDate = new Date(this.weightEvolution[0].date);
    this.maxDate = new Date(this.weightEvolution[this.weightEvolution.length - 1].date);

    const chartWidth = 500;
    const chartHeight = 150;

    this.chartPoints = this.weightEvolution.map((entry, index) => {
      const x = (index / (this.weightEvolution.length - 1)) * chartWidth;
      const y = chartHeight - ((entry.weight - this.minWeight) / (this.maxWeight - this.minWeight)) * chartHeight;
      return { x, y, date: entry.date, weight: entry.weight };
    });

    if (this.goalWeight !== undefined) {
      this.goalLineY = chartHeight - ((this.goalWeight - this.minWeight) / (this.maxWeight - this.minWeight)) * chartHeight;
    }
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  getYAxisLabels(): number[] {
    if (this.minWeight === this.maxWeight) return [this.minWeight];
    const step = (this.maxWeight - this.minWeight) / 3;
    return [0, 1, 2, 3].map(i => Math.round(this.minWeight + i * step)).reverse();
  }
}
