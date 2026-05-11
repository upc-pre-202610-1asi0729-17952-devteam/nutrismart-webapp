import { Component, computed, input, output } from '@angular/core';
import { AdherenceStatus } from '../../../domain/model/adherence-status.enum';

/**
 * Displays re-engagement guidance when the user is at risk or off track.
 * This card appears as a priority banner in the Dashboard.
 */
@Component({
  selector: 'app-re-engagement-card',
  templateUrl: './re-engagement-card.html',
  styleUrl: './re-engagement-card.css',
})
export class ReEngagementCard {
  /** Current adherence status from BehavioralConsistencyStore. */
  readonly status = input.required<AdherenceStatus>();

  /** Emits when the user accepts the recommended re-engagement action. */
  readonly actionAccepted = output<void>();

  /** * Dynamic content based on the severity of the consistency drop.
   */
  readonly content = computed(() => {
    switch (this.status()) {
      case AdherenceStatus.AT_RISK:
        return {
          title: '¡No pierdas el impulso!',
          desc: 'Has faltado a un par de registros. Completa una acción pequeña hoy para proteger tu racha.',
          btnText: 'Registrar ahora',
          icon: '⚠️'
        };
      case AdherenceStatus.OFF_TRACK:
        return {
          title: 'Es momento de reiniciar',
          desc: 'Llevas un tiempo sin actividad. Reinicia con una meta simple: registra tu siguiente comida.',
          btnText: 'Volver al plan',
          icon: '🚀'
        };
      default:
        return null;
    }
  });

  /**
   * Emits the accepted action event.
   */
  acceptAction(): void {
    this.actionAccepted.emit();
  }
}
