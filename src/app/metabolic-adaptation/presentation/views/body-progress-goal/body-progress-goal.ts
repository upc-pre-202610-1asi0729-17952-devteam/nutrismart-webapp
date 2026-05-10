import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { NgClass } from '@angular/common';
import { IamStore } from '../../../../iam/application/iam.store';
import { UserGoal } from '../../../../iam/domain/model/user-goal.enum';
import { MetabolicStore } from '../../application/metabolic.store';

/**
 * Goal Selection screen — first view shown when the user navigates to /body-progress.
 *
 * Presents two selectable cards ("Lose weight" / "Gain muscle"). On confirm it
 * calls {@link IamStore.changeGoal}, which synchronously updates the goal signal
 * (and persists to the API in the background), then navigates to
 * /body-progress/progress. The BodyProgressView at that route reads
 * `MetabolicStore.isMuscleGain()` and renders either the WA_BP_LOSS layout
 * (BMR · TDEE · Weight Evolution · Log History) or the WA_BP_GAIN layout
 * (% Body Fat · Lean Mass · Body Composition) automatically.
 *
 * Component name: GoalSelectionScreen (per task spec)
 *
 * @author Espinoza Cruz, Angela Milagros
 */
@Component({
  selector: 'app-body-progress-goal',
  imports: [NgClass],
  templateUrl: './body-progress-goal.html',
  styleUrl: './body-progress-goal.css',
})
export class GoalSelectionScreen {
  private iamStore       = inject(IamStore);
  private metabolicStore = inject(MetabolicStore);
  private router         = inject(Router);

  /** Expose enum to the template. */
  readonly UserGoal = UserGoal;

  /**
   * Currently highlighted goal. Pre-filled from the authenticated user's existing
   * goal so returning users see their prior selection highlighted on entry.
   */
  protected selectedGoal = signal<UserGoal | null>(
    this.iamStore.currentUser()?.goal ?? null,
  );

  /** Enables the Continue button only when a card has been selected. */
  protected hasSelection = computed(() => this.selectedGoal() !== null);

  /**
   * Returns `true` when the given goal matches the current selection.
   *
   * @param goal - The goal to test against the current selection.
   */
  protected isSelected(goal: UserGoal): boolean {
    return this.selectedGoal() === goal;
  }

  /**
   * Highlights the tapped card. Tapping the same card a second time deselects it.
   *
   * @param goal - The goal the user tapped.
   */
  selectGoal(goal: UserGoal): void {
    this.selectedGoal.set(this.selectedGoal() === goal ? null : goal);
  }

  /**
   * Applies the selected goal and navigates to the body-progress dashboard.
   *
   * {@link IamStore.changeGoal} recalculates macros and updates the goal signal
   * synchronously so that `MetabolicStore.isMuscleGain()` reflects the new value
   * before the destination route initialises.
   */
  onContinue(): void {
    const goal = this.selectedGoal();
    if (!goal) return;

    // 1. Persist to user profile (async, background)
    this.iamStore.changeGoal(goal);

    // 2. Write to MetabolicStore via a fresh primitive signal BEFORE navigating.
    //    IamStore.changeGoal() mutates the User in place — same object reference —
    //    so Angular's signal equality check (Object.is) never notifies MetabolicStore
    //    subscribers. setSessionGoal() writes a new primitive value to a separate
    //    signal, guaranteeing that isMuscleGain() is correct when the view mounts.
    this.metabolicStore.setSessionGoal(goal);

    this.router.navigate(['/body-progress', 'progress']);
  }
}
