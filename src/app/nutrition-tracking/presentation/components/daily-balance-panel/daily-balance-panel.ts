import { Component, computed, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
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
  imports: [DecimalPipe],
  templateUrl: './daily-balance-panel.html',
  styleUrl: './daily-balance-panel.css',
})
export class DailyBalancePanelComponent {

  private nutritionStore = inject(NutritionStore);

  protected dailyGoal       = computed(() => this.nutritionStore.dailyIntake()?.dailyGoal ?? 1800);
  protected consumed        = computed(() => this.nutritionStore.dailyTotals().calories);
  protected active          = computed(() => this.nutritionStore.dailyIntake()?.active ?? 300);
  protected exceeded        = computed(() => this.nutritionStore.isDailyGoalExceeded());
  protected percentConsumed = computed(() => {
    const net = this.dailyGoal() + this.active();
    return net > 0 ? Math.min(Math.round((this.consumed() / net) * 100), 100) : 0;
  });
  protected netCalories = computed(() =>
    Math.abs(this.dailyGoal() + this.active() - this.consumed())
  );
}
