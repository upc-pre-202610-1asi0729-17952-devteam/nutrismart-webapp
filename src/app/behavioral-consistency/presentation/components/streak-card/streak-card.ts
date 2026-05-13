import { Component, computed, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

/**
 * Displays the user's current streak and missed-day count with motivational feedback.
 */
@Component({
  selector: 'app-streak-card',
  templateUrl: './streak-card.html',
  styleUrl: './streak-card.css',
  imports: [TranslatePipe],
})
export class StreakCard {
  /** Consecutive successful days. */
  readonly streak = input.required<number>();

  /** Consecutive missed days. */
  readonly consecutiveMisses = input.required<number>();

  /** i18n key for the contextual motivational message. */
  readonly streakMessageKey = computed(() => {
    const streak = this.streak();
    const misses = this.consecutiveMisses();
    if (misses >= 2) return 'behavioral.streak.message_danger';
    if (streak === 0) return 'behavioral.streak.message_start';
    if (streak < 4)  return 'behavioral.streak.message_beginning';
    if (streak < 8)  return 'behavioral.streak.message_habit';
    return 'behavioral.streak.message_unstoppable';
  });

  /** Whether there are missed days that should be highlighted. */
  readonly hasMisses = computed(() => this.consecutiveMisses() > 0);
}
