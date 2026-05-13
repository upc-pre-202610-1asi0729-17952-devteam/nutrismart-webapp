import { Component, computed, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

/**
 * Displays a compact weekly consistency strip based on completion flags.
 * Used in Dashboard and Analytics to show the 7-day adherence pattern.
 */
@Component({
  selector: 'app-consistency-week-strip',
  templateUrl: './consistency-week-strip.html',
  styleUrl: './consistency-week-strip.css',
  imports: [TranslatePipe],
})
export class ConsistencyWeekStrip {
  /** Weekly completion flags (true = logged, false = missed/pending). */
  readonly weekDots = input.required<boolean[]>();

  /** Labels for the seven-day strip. */
  readonly dayLabels = input<string[]>(['M', 'T', 'W', 'T', 'F', 'S', 'S']);

  /** Number of completed days in the strip for summary text. */
  readonly completedCount = computed(() =>
    this.weekDots().filter(Boolean).length
  );
}
