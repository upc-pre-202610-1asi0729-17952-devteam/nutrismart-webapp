import { Component, computed, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';

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

  /** Calories consumed for the currently selected date — provided by the parent. */
  readonly consumed  = input<number>(0);
  /** User's daily calorie goal for the selected date — provided by the parent. */
  readonly dailyGoal = input<number>(1800);
  /** Active calories burned for the selected date — provided by the parent. */
  readonly active    = input<number>(0);

  protected readonly exceeded        = computed(() => this.consumed() > this.dailyGoal());
  protected readonly percentConsumed = computed(() => {
    const net = this.dailyGoal() + this.active();
    return net > 0 ? Math.min(Math.round((this.consumed() / net) * 100), 100) : 0;
  });
  protected readonly netCalories = computed(() =>
    Math.abs(this.dailyGoal() + this.active() - this.consumed())
  );
}
