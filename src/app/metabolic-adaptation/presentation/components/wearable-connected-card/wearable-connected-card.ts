import { Component, input, output, computed } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { WearableConnection } from '../../../domain/model/wearable-connection.entity';
import { ActivityLog } from '../../../domain/model/activity-log.entity';

@Component({
  selector: 'app-wearable-connected-card',
  imports: [TranslatePipe, DecimalPipe],
  templateUrl: './wearable-connected-card.html',
  styleUrl: './wearable-connected-card.css',
})
export class WearableConnectedCard {
  readonly connection       = input.required<WearableConnection>();
  readonly netCalories      = input<number>(0);
  readonly netDailyTarget   = input<number>(0);
  readonly baseTarget       = input<number>(0);
  readonly weekLogs         = input<ActivityLog[]>([]);
  readonly isLoading        = input<boolean>(false);

  readonly syncNow      = output<void>();
  readonly disconnect   = output<void>();

  readonly minutesSinceSync = computed(() => this.connection().minutesSinceSync());

  readonly syncLabel = computed(() => {
    const mins = this.minutesSinceSync();
    if (mins < 60) return `${mins}m ago`;
    const h = Math.floor(mins / 60);
    return `${h}h ago`;
  });

  readonly remainingToday = computed(() =>
    this.netDailyTarget() - 0,
  );

  onSyncNow(): void { this.syncNow.emit(); }
  onDisconnect(): void { this.disconnect.emit(); }

  formatLogDate(timestamp: string): string {
    return new Date(timestamp).toLocaleDateString('en-US', { weekday: 'short' });
  }
}
