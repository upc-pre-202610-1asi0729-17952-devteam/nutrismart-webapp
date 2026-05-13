import { Component, computed, input } from '@angular/core';
import { NgClass } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';

/**
 * Displays aggregated behavioral consistency indicators.
 */
@Component({
  selector: 'app-behavioral-summary-card',
  templateUrl: './behavioral-summary-card.html',
  styleUrl: './behavioral-summary-card.css',
  imports: [NgClass, TranslatePipe],
})
export class BehavioralSummaryCard {
  /** Number of completed days in the current weekly view. */
  readonly completedDaysThisWeek = input.required<number>();

  /** Weekly completion rate from 0 to 100. */
  readonly weeklyCompletionRate = input.required<number>();

  /** Compact domain summary. */
  readonly summary = input.required<string>();

  /** i18n key for the progress label based on weekly completion rate. */
  readonly progressLabelKey = computed(() => {
    const rate = this.weeklyCompletionRate();
    if (rate >= 80) return 'behavioral.summary_card.high_consistency';
    if (rate >= 50) return 'behavioral.summary_card.moderate_consistency';
    return 'behavioral.summary_card.at_risk_consistency';
  });

  /** Color variant based on rate for the UI. */
  readonly rateVariant = computed(() => {
    const rate = this.weeklyCompletionRate();
    if (rate >= 80) return 'success';
    if (rate >= 50) return 'warning';
    return 'danger';
  });
}
