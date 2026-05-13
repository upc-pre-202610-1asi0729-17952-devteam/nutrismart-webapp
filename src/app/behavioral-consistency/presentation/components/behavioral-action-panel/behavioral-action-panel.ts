import { Component, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

/**
 * Provides user-triggered behavioral actions for the dashboard.
 * Based on NutriSmart Consistency tracking (Section 1).
 */
@Component({
  selector: 'app-behavioral-action-panel',
  templateUrl: './behavioral-action-panel.html',
  styleUrl: './behavioral-action-panel.css',
  imports: [TranslatePipe],
})
export class BehavioralActionPanel {
  /** Emits when the user records a positive consistency action. */
  readonly goalMet = output<void>();

  /** Emits when the user explicitly marks a skip. */
  readonly goalMissed = output<void>();

  /** Emits when the user requests a sync (e.g., with Google Fit/Wearables). */
  readonly refreshRequested = output<void>();

  /**
   * Triggers the Meal/Goal Logged event.
   */
  markGoalMet(): void {
    this.goalMet.emit();
  }

  /**
   * Triggers the Skip event, which could lead to AT_RISK status if repetitive.
   */
  markGoalMissed(): void {
    this.goalMissed.emit();
  }

  /**
   * Syncs data with external sources to update Net Balance.
   */
  refresh(): void {
    this.refreshRequested.emit();
  }
}
