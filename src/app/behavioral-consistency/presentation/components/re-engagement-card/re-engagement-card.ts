import { Component, computed, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { AdherenceStatus } from '../../../domain/model/adherence-status.enum';
import { RecoveryPlan } from '../../../domain/model/recovery-plan.entity';

/**
 * Displays re-engagement guidance when the user is at risk or off track.
 *
 * Shows the active {@link RecoveryPlan} actions when available, or falls back
 * to a generic status-based message derived from i18n keys.
 */
@Component({
  selector: 'app-re-engagement-card',
  templateUrl: './re-engagement-card.html',
  styleUrl: './re-engagement-card.css',
  imports: [TranslatePipe],
})
export class ReEngagementCard {
  /** Current adherence status from BehavioralConsistencyStore. */
  readonly status = input.required<AdherenceStatus>();

  /** Active recovery plan, or null when none exists. */
  readonly plan = input<RecoveryPlan | null>(null);

  /** Emits when the user accepts the recommended re-engagement action. */
  readonly actionAccepted = output<void>();

  /** Whether the card should be displayed at all. */
  readonly isVisible = computed(() => this.status() !== AdherenceStatus.ON_TRACK);

  /** Whether the adherence status is AT_RISK (used for CSS modifier). */
  readonly isAtRisk = computed(() => this.status() === AdherenceStatus.AT_RISK);

  /** i18n key for the icon character, based on adherence status. */
  readonly iconKey = computed(() =>
    this.status() === AdherenceStatus.AT_RISK
      ? 'behavioral.reengagement.icon_at_risk'
      : 'behavioral.reengagement.icon_dropped',
  );

  /** i18n key for the card title, based on adherence status. */
  readonly titleKey = computed(() =>
    this.status() === AdherenceStatus.AT_RISK
      ? 'behavioral.reengagement.title_at_risk'
      : 'behavioral.reengagement.title_dropped',
  );

  /** i18n key for the card description, based on adherence status. */
  readonly descKey = computed(() =>
    this.status() === AdherenceStatus.AT_RISK
      ? 'behavioral.reengagement.desc_at_risk'
      : 'behavioral.reengagement.desc_dropped',
  );

  /** i18n key for the CTA button label. */
  readonly btnKey = computed(() =>
    this.status() === AdherenceStatus.AT_RISK
      ? 'behavioral.reengagement.btn_at_risk'
      : 'behavioral.reengagement.btn_dropped',
  );

  /** Ordered actions from the active plan, or an empty array. */
  readonly planActions = computed(() => this.plan()?.actions ?? []);

  /** Whether there are plan-prescribed actions to display. */
  readonly hasPlanActions = computed(() => this.planActions().length > 0);

  /** Emits the accepted action event. */
  acceptAction(): void {
    this.actionAccepted.emit();
  }
}
