import { inject, Injectable } from '@angular/core';
import { filter, interval } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { IamStore } from '../../iam/application/iam.store';
import { NutritionStore } from '../../nutrition-tracking/application/nutrition.store';
import { MetabolicStore } from '../../metabolic-adaptation/application/metabolic.store';
import { WearableStore } from '../../metabolic-adaptation/application/wearable.store';

/**
 * Application-level scheduler that fires time-based domain checks every minute.
 *
 * Replaces the missing "automático, diario" triggers from the event storming:
 * - Meal window close detection (every tick while UI is open)
 * - End-of-day goal evaluation (once at 23:00+)
 * - Stagnation detection (once per calendar day)
 * - Wearable sync (once per clock-hour when connected)
 *
 * Persistence keys in {@link localStorage} prevent duplicate events within the
 * same day/hour across multiple ticks.
 *
 * Eagerly initialised by injection in {@link App}.
 */
@Injectable({ providedIn: 'root' })
export class AppSchedulerService {
  private readonly iamStore       = inject(IamStore);
  private readonly nutritionStore = inject(NutritionStore);
  private readonly metabolicStore = inject(MetabolicStore);
  private readonly wearableStore  = inject(WearableStore);

  constructor() {
    interval(60_000)
      .pipe(
        takeUntilDestroyed(),
        filter(() => !!this.iamStore.currentUser()),
      )
      .subscribe(() => this.tick());
  }

  private tick(): void {
    this.nutritionStore.checkMealWindows();
    this.checkEndOfDay();
    this.metabolicStore.runDailyStagnationCheck();
    this.checkWearableSync();
  }

  /**
   * Triggers the end-of-day evaluation once per calendar day after 23:00.
   * Uses localStorage to deduplicate across multiple ticks.
   */
  private checkEndOfDay(): void {
    if (new Date().getHours() < 23) return;
    const key = `nutrismart.eod.${new Date().toISOString().slice(0, 10)}`;
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, '1');
    this.nutritionStore.runEndOfDayCheck();
  }

  /**
   * Triggers wearable sync once per clock-hour when the device is connected.
   * Uses localStorage with an hourly key to deduplicate across ticks.
   */
  private checkWearableSync(): void {
    const conn = this.wearableStore.connection();
    if (!conn?.isHealthy()) return;
    const hourKey = `nutrismart.wsync.${new Date().toISOString().slice(0, 13)}`;
    if (localStorage.getItem(hourKey)) return;
    localStorage.setItem(hourKey, '1');
    void this.wearableStore.syncNow();
  }
}
