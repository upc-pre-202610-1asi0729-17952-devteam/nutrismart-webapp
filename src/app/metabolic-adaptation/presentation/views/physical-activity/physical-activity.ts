import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { WearableStore } from '../../../application/wearable.store';
import { IamStore } from '../../../../iam/application/iam.store';
import { WearableStatus } from '../../../domain/model/wearable-status.enum';
import { isHealthOAuthConfigured, startHealthOAuth } from '../../../infrastructure/oauth-google-health';
import { ActivityPaywallCard } from '../../components/activity-paywall-card/activity-paywall-card';
import { ManualActivityModal } from '../../components/manual-activity-modal/manual-activity-modal';
import { WearableChip } from '../../components/wearable-chip/wearable-chip';
import { WearableSyncModal } from '../../components/wearable-sync-modal/wearable-sync-modal';
import { ActivityHistoryPanel } from '../../components/activity-history-panel/activity-history-panel';

@Component({
  selector: 'app-physical-activity',
  imports: [
    TranslatePipe,
    ActivityPaywallCard,
    ManualActivityModal,
    WearableChip,
    WearableSyncModal,
    ActivityHistoryPanel,
  ],
  templateUrl: './physical-activity.html',
  styleUrl: './physical-activity.css',
})
export class PhysicalActivityView implements OnInit {
  protected readonly store    = inject(WearableStore);
  protected readonly iamStore = inject(IamStore);
  private readonly route      = inject(ActivatedRoute);
  private readonly router     = inject(Router);

  protected readonly showModal     = signal(false);
  protected readonly showSyncModal = signal(false);
  protected readonly oauthConfigured = isHealthOAuthConfigured();
  protected readonly showAll     = signal(false);
  protected readonly currentPage = signal(1);

  protected readonly pageSize = 15;

  /** Whether a wearable device is currently connected — drives the chip color. */
  protected readonly isWearableConnected = computed(() =>
    this.store.connection()?.status === WearableStatus.CONNECTED,
  );

  get isPremium(): boolean {
    return this.iamStore.currentUser()?.isPremium() ?? false;
  }

  /** All logs sorted newest-first. */
  private readonly sortedLogs = computed(() =>
    [...this.store.activityLogs()]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
  );

  /** Slice of logs to display — first 15 in summary mode, one page in full mode. */
  protected readonly displayedLogs = computed(() => {
    if (!this.showAll()) return this.sortedLogs().slice(0, this.pageSize);
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.sortedLogs().slice(start, start + this.pageSize);
  });

  /** Total pages for the full paginated view. */
  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.store.activityLogs().length / this.pageSize)),
  );

  ngOnInit(): void {
    this.store.load();
    this.handleOAuthReturn();
  }

  /**
   * When returning from the Google OAuth callback (`?health=connected|error`),
   * open the sync dialog to show the outcome and strip the query param.
   */
  private handleOAuthReturn(): void {
    const health = this.route.snapshot.queryParamMap.get('health');
    if (!health) return;
    this.showSyncModal.set(true);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { health: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  onOpenModal(): void  { this.showModal.set(true); }
  onCloseModal(): void { this.showModal.set(false); }

  // ── Wearable sync dialog ──────────────────────────────────────────────────

  onChipClick(): void        { this.showSyncModal.set(true); }
  onCloseSyncModal(): void   { this.showSyncModal.set(false); }

  /**
   * Starts the connection flow. With a configured OAuth client it redirects to
   * Google's consent screen (the app resumes on `/oauth/health/callback`);
   * otherwise it connects in simulated mode without leaving the app.
   */
  async onConnect(): Promise<void> {
    if (this.oauthConfigured) {
      startHealthOAuth();
      return;
    }
    await this.store.connectGoogleHealth();
  }

  async onSyncNow(): Promise<void> {
    await this.store.syncNow();
  }

  async onDisconnect(): Promise<void> {
    await this.store.disconnectWearable();
    this.showSyncModal.set(false);
  }

  async onAutoSyncChange(enabled: boolean): Promise<void> {
    try {
      await this.store.setAutoSync(enabled);
    } catch {
      // Rollback is handled in the store; the switch re-reads the connection signal.
    }
  }

  onPreviewCalories(event: { activityKey: string; durationMinutes: number }): void {
    this.store.previewCalories(event.activityKey, event.durationMinutes);
  }

  async onSaveActivity(event: { activityKey: string; durationMinutes: number }): Promise<void> {
    await this.store.logManualActivity(event.activityKey, event.durationMinutes);
    this.showModal.set(false);
  }

  onViewAll(): void {
    this.showAll.set(true);
    this.currentPage.set(1);
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
  }
}
