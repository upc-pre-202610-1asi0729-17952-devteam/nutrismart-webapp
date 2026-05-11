import { Component, computed, input } from '@angular/core';
import {NgClass} from '@angular/common';

/**
 * Displays aggregated behavioral consistency indicators.
 * Based on NutriSmart Weekly Progress specs.
 */
@Component({
  selector: 'app-behavioral-summary-card',
  templateUrl: './behavioral-summary-card.html',
  styleUrl: './behavioral-summary-card.css',
  imports: [
    NgClass
  ]
})
export class BehavioralSummaryCard {
  /** Number of completed days in the current weekly view. */
  readonly completedDaysThisWeek = input.required<number>();

  /** Weekly completion rate from 0 to 100. */
  readonly weeklyCompletionRate = input.required<number>();

  /** Compact domain summary. */
  readonly summary = input.required<string>();

  /** Progress label based on weekly completion rate according to NutriSmart thresholds. */
  readonly progressLabel = computed(() => {
    const rate = this.weeklyCompletionRate();

    if (rate >= 80) {
      return 'Alta Consistencia';
    }

    if (rate >= 50) {
      return 'Consistencia Moderada';
    }

    return 'Consistencia en Riesgo';
  });

  /** Color variant based on rate for the UI */
  readonly rateVariant = computed(() => {
    const rate = this.weeklyCompletionRate();
    if (rate >= 80) return 'success';
    if (rate >= 50) return 'warning';
    return 'danger';
  });
}
