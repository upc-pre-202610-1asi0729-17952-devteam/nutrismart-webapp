import { Component, computed, input } from '@angular/core';
import { NgClass } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { AdherenceStatus } from '../../../domain/model/adherence-status.enum';

/**
 * Displays the user's current behavioral adherence status.
 */
@Component({
  selector: 'app-adherence-status-card',
  templateUrl: './adherence-status-card.html',
  styleUrl: './adherence-status-card.css',
  imports: [NgClass, TranslatePipe],
})
export class AdherenceStatusCard {
  /** Current adherence status from Domain. */
  readonly status = input.required<AdherenceStatus>();

  /** i18n key for the status badge title. */
  readonly titleKey = computed(() => {
    switch (this.status()) {
      case AdherenceStatus.ON_TRACK: return 'behavioral.status.on_track_title';
      case AdherenceStatus.AT_RISK:  return 'behavioral.status.at_risk_title';
      case AdherenceStatus.DROPPED:  return 'behavioral.status.dropped_title';
      default:                       return 'behavioral.status.on_track_title';
    }
  });

  /** i18n key for the descriptive status message. */
  readonly messageKey = computed(() => {
    switch (this.status()) {
      case AdherenceStatus.ON_TRACK: return 'behavioral.status.on_track_message';
      case AdherenceStatus.AT_RISK:  return 'behavioral.status.at_risk_message';
      case AdherenceStatus.DROPPED:  return 'behavioral.status.dropped_message';
      default:                       return 'behavioral.status.unknown_message';
    }
  });

  /** CSS class name derived from status for dynamic styling. */
  readonly statusClass = computed(() => this.status().toLowerCase().replace('_', '-'));
}
