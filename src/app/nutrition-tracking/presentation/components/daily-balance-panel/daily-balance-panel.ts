import { Component, computed, inject, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { NutritionStore } from '../../../application/nutrition.store';

/**
 * Daily balance card shown in the right column of the Daily Log.
 *
 * Displays daily goal, consumed, active and remaining/exceeded calories
 * with a colour-coded progress bar.
 *
 * @author Mora Rivera, Joel Fernando
 */
@Component({
  selector: 'app-daily-balance-panel',
  imports: [DecimalPipe, TranslatePipe],
  templateUrl: './daily-balance-panel.html',
  styleUrl: './daily-balance-panel.css',
})
export class DailyBalancePanelComponent {

  private nutritionStore = inject(NutritionStore);

  /** Calories consumed for the currently selected date — provided by the parent. */
  readonly consumed = input<number>(0);

  protected readonly dailyGoal       = computed(() => this.nutritionStore.dailyIntake()?.dailyGoal ?? 1800);
  protected readonly active          = computed(() => this.nutritionStore.dailyIntake()?.active ?? 0);
  protected readonly exceeded        = computed(() => this.consumed() > this.dailyGoal());
  protected readonly percentConsumed = computed(() => {
    const net = this.dailyGoal() + this.active();
    return net > 0 ? Math.min(Math.round((this.consumed() / net) * 100), 100) : 0;
  });
  protected readonly netCalories = computed(() =>
    Math.abs(this.dailyGoal() + this.active() - this.consumed())
  );
}
