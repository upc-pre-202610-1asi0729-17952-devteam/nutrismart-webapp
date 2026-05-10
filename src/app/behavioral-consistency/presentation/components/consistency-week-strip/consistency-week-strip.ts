import { Component, computed, input } from '@angular/core';

/**
 * Displays a compact weekly consistency strip based on completion flags.
 * Used in Dashboard and Analytics to show the 7-day adherence pattern.
 */
@Component({
  selector: 'app-consistency-week-strip',
  templateUrl: './consistency-week-strip.html',
  styleUrl: './consistency-week-strip.css',
})
export class ConsistencyWeekStrip {
  /** Weekly completion flags (true = logged, false = missed/pending). */
  readonly weekDots = input.required<boolean[]>();

  /** Labels for the seven-day strip. Default to Spanish initials. */
  readonly dayLabels = input<string[]>(['L', 'M', 'X', 'J', 'V', 'S', 'D']);

  /** Number of completed days in the strip for summary text. */
  readonly completedCount = computed(() =>
    this.weekDots().filter(Boolean).length
  );

  /** Accessibility label for the strip. */
  readonly ariaLabel = computed(() =>
    `Consistencia de la semana: ${this.completedCount()} de 7 días completados`
  );
}
