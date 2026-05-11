import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { NgClass } from '@angular/common';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { IamStore } from '../../../../iam/application/iam.store';
import { UserGoal } from '../../../../iam/domain/model/user-goal.enum';
import { MetabolicStore } from '../../../application/metabolic.store';

@Component({
  selector: 'app-body-progress-goal',
  imports: [NgClass, TranslatePipe],
  templateUrl: './body-progress-goal.html',
  styleUrl: './body-progress-goal.css',
})
export class GoalSelectionScreen {
  private iamStore       = inject(IamStore);
  private metabolicStore = inject(MetabolicStore);
  private router         = inject(Router);
  private translate      = inject(TranslateService);

  readonly UserGoal = UserGoal;

  protected selectedGoal = signal<UserGoal | null>(
    this.iamStore.currentUser()?.goal ?? null,
  );

  protected hasSelection  = computed(() => this.selectedGoal() !== null);
  protected submitting    = signal<boolean>(false);
  protected showConfirm   = signal<boolean>(false);

  protected currentGoal     = computed(() => this.iamStore.currentUser()?.goal ?? null);
  protected isLocked        = computed(() => this.metabolicStore.isGoalLocked());
  protected daysLeft        = computed(() => this.metabolicStore.daysUntilUnlock());
  protected unlockDate      = computed(() => this.metabolicStore.unlockDate());
  protected goalStartedAt   = computed(() => this.iamStore.currentUser()?.goalStartedAt ?? '');

  protected goalName(goal: UserGoal | null): string {
    if (!goal) return '';
    return goal === UserGoal.WEIGHT_LOSS
      ? this.translate.instant('body_progress.goal_name_weight_loss')
      : this.translate.instant('body_progress.goal_name_muscle_gain');
  }

  protected isSelected(goal: UserGoal): boolean {
    return this.selectedGoal() === goal;
  }

  selectGoal(goal: UserGoal): void {
    this.selectedGoal.set(this.selectedGoal() === goal ? null : goal);
  }

  async onContinue(): Promise<void> {
    const goal = this.selectedGoal();
    if (!goal || this.submitting()) return;
    if (this.isLocked() && goal !== this.currentGoal()) {
      this.showConfirm.set(true);
      return;
    }
    await this.commitGoal(goal);
  }

  async onConfirmSwitch(): Promise<void> {
    const goal = this.selectedGoal();
    if (!goal) return;
    this.showConfirm.set(false);
    await this.commitGoal(goal);
  }

  onCancelSwitch(): void {
    this.showConfirm.set(false);
    this.selectedGoal.set(this.currentGoal());
  }

  private async commitGoal(goal: UserGoal): Promise<void> {
    this.submitting.set(true);
    try {
      this.iamStore.changeGoal(goal);
      await this.metabolicStore.applyInitialTarget(goal);
      this.router.navigate(['/body-progress', 'progress']);
    } finally {
      this.submitting.set(false);
    }
  }
}
