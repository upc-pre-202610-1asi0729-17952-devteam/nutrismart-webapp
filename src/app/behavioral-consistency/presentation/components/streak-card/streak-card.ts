import { Component, computed, input } from '@angular/core';

/**
 * Displays the user's current streak and missed-day count with motivational feedback.
 */
@Component({
  selector: 'app-streak-card',
  templateUrl: './streak-card.html',
  styleUrl: './streak-card.css',
})
export class StreakCard {
  /** Consecutive successful days. */
  readonly streak = input.required<number>();

  /** Consecutive missed days. */
  readonly consecutiveMisses = input.required<number>();

  /** Contextual message based on the current streak and misses. */
  readonly streakMessage = computed(() => {
    const streak = this.streak();
    const misses = this.consecutiveMisses();

    if (misses >= 2) {
      return '¡Cuidado! Tu racha está en peligro.';
    }

    if (streak === 0) {
      return 'Empieza hoy tu primer registro.';
    }

    if (streak < 4) return '¡Buen comienzo! No te detengas.';
    if (streak < 8) return '¡Gran ritmo! Estás creando un hábito.';

    return '¡Eres imparable! Tu constancia es clave.';
  });

  /** Whether there are missed days that should be highlighted. */
  readonly hasMisses = computed(() => this.consecutiveMisses() > 0);
}
