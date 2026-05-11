import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-weight-evolution-chart',
  standalone: true,
  imports: [CommonModule],
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

    const weights = this.weightEvolution.map(entry => entry.weight);
    if (this.goalWeight !== undefined) {
      weights.push(this.goalWeight);
    }

    this.minWeight = Math.min(...weights) - 2; // Add some padding
    this.maxWeight = Math.max(...weights) + 2; // Add some padding

    this.minDate = new Date(this.weightEvolution[0].date);
    this.maxDate = new Date(this.weightEvolution[this.weightEvolution.length - 1].date);

    const chartWidth = 500; // Fixed width for scaling purposes in SVG
    const chartHeight = 150; // Fixed height for scaling purposes in SVG

    this.chartPoints = this.weightEvolution.map((entry, index) => {
      const date = new Date(entry.date);
      const x = (index / (this.weightEvolution.length - 1)) * chartWidth;
      const y = chartHeight - ((entry.weight - this.minWeight) / (this.maxWeight - this.minWeight)) * chartHeight;
      return { x, y, date: entry.date, weight: entry.weight };
    });

    if (this.goalWeight !== undefined) {
      this.goalLineY = chartHeight - ((this.goalWeight - this.minWeight) / (this.maxWeight - this.minWeight)) * chartHeight;
    }
  }

  // Helper to format date for X-axis labels
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  // Helper to generate Y-axis labels
  getYAxisLabels(): number[] {
    if (this.minWeight === this.maxWeight) return [this.minWeight];
    const labels: number[] = [];
    const step = (this.maxWeight - this.minWeight) / 3; // 3 steps for 4 labels
    for (let i = 0; i <= 3; i++) {
      labels.push(Math.round(this.minWeight + i * step));
    }
    return labels.reverse(); // Display higher values at the top
  }
}
