import { Component, input, output, computed } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { WearableConnection } from '../../../domain/model/wearable-connection.entity';

@Component({
  selector: 'app-sync-failed-banner',
  imports: [TranslatePipe],
  templateUrl: './sync-failed-banner.html',
  styleUrl: './sync-failed-banner.css',
})
export class SyncFailedBanner {
  readonly connection = input.required<WearableConnection>();
  readonly isLoading  = input<boolean>(false);
  readonly retry      = output<void>();
  readonly disconnect = output<void>();

  readonly hoursSinceSync = computed(() => this.connection().hoursSinceSync());

  onRetry(): void { this.retry.emit(); }
  onDisconnect(): void { this.disconnect.emit(); }
}
