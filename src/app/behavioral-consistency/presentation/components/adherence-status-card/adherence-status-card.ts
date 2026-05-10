import { Component, computed, input } from '@angular/core';
import { AdherenceStatus } from '../../../domain/model/adherence-status.enum';
import {NgClass} from '@angular/common';

/**
 * Displays the user's current behavioral adherence status.
 * Based on NutriSmart Behavioral Consistency specs (Section 1).
 */
@Component({
  selector: 'app-adherence-status-card',
  templateUrl: './adherence-status-card.html',
  styleUrl: './adherence-status-card.css',
  imports: [
    NgClass
  ]
})
export class AdherenceStatusCard {
  /** Current adherence status from Domain. */
  readonly status = input.required<AdherenceStatus>();

  /** * Mapping titles to the specific behavior detected in pantallas.md
   */
  readonly title = computed(() => {
    switch (this.status()) {
      case AdherenceStatus.ON_TRACK:
        return '✓ ON_TRACK';
      case AdherenceStatus.AT_RISK:
        return '⚠ AT_RISK';
      case AdherenceStatus.OFF_TRACK:
        return '✖ DROPPED';
      default:
        return 'Status Unknown';
    }
  });

  /** * Messages based on the DDD events described in the source:
   * BehavioralDropDetected (3 misses) and NutritionalAbandonmentRisk (7 days)
   */
  readonly message = computed(() => {
    switch (this.status()) {
      case AdherenceStatus.ON_TRACK:
        return 'Keep it up! Your consistency is stable. Continue logging your daily meals.';
      case AdherenceStatus.AT_RISK:
        return 'Nutritional adherence at risk. You have missed 3 consecutive logs. Let\'s get back on track!';
      case AdherenceStatus.OFF_TRACK:
        return 'Behavioral drop detected. 7 days of inactivity. Access your reactivation plan to recover your streak.';
      default:
        return 'Please log your first meal of the day to update your status.';
    }
  });

  /** Returns CSS class name based on status for dynamic styling */
  readonly statusClass = computed(() => this.status().toLowerCase().replace('_', '-'));
}
