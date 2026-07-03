import { Component, computed, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { WearableConnection } from '../../../domain/model/wearable-connection.entity';
import { WearableStatus } from '../../../domain/model/wearable-status.enum';

/**
 * Google Health synchronization dialog.
 *
 * Renders two states:
 *  - **disconnected**: a brand card, requested permissions and a "connect" CTA
 *    that starts the Google OAuth consent flow.
 *  - **connected**: connected-since / last-sync info, an auto-sync switch,
 *    a "sync now" action and a "disconnect" action.
 */
@Component({
  selector: 'app-wearable-sync-modal',
  imports: [TranslatePipe],
  templateUrl: './wearable-sync-modal.html',
  styleUrl: './wearable-sync-modal.css',
})
export class WearableSyncModal {
  readonly connection      = input<WearableConnection | null>(null);
  readonly isLoading       = input<boolean>(false);
  readonly error           = input<string | null>(null);
  /** When false, the connect action runs in simulated mode (no Google redirect). */
  readonly oauthConfigured = input<boolean>(true);

  readonly connect        = output<void>();
  readonly syncNow        = output<void>();
  readonly disconnect     = output<void>();
  readonly autoSyncChange = output<boolean>();
  readonly cancel         = output<void>();

  readonly isConnected = computed(() =>
    this.connection()?.status === WearableStatus.CONNECTED,
  );

  readonly autoSyncEnabled = computed(() => this.connection()?.autoSyncEnabled ?? false);

  readonly connectedSinceLabel = computed(() => this.formatDate(this.connection()?.authorizedAt));

  readonly lastSyncLabel = computed(() => {
    const at = this.connection()?.lastSyncedAt;
    return at ? this.formatDate(at) : null;
  });

  private formatDate(iso?: string | null): string {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  }

  onConnect(): void    { this.connect.emit(); }
  onSyncNow(): void    { this.syncNow.emit(); }
  onDisconnect(): void { this.disconnect.emit(); }
  onCancel(): void     { this.cancel.emit(); }

  onAutoSyncToggle(event: Event): void {
    this.autoSyncChange.emit((event.target as HTMLInputElement).checked);
  }
}
