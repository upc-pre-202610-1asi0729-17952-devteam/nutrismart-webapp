import { Component, inject, signal, OnInit } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { WearableStore } from '../../../application/wearable.store';
import { IamStore } from '../../../../iam/application/iam.store';
import { WearableStatus } from '../../../domain/model/wearable-status.enum';
import { SubscriptionPlan } from '../../../../iam/domain/model/subscription-plan.enum';
import { GoogleFitConnectCard } from '../../components/google-fit-connect-card/google-fit-connect-card';
import { ManualActivityCard } from '../../components/manual-activity-card/manual-activity-card';
import { WearableConnectedCard } from '../../components/wearable-connected-card/wearable-connected-card';
import { SyncFailedBanner } from '../../components/sync-failed-banner/sync-failed-banner';
import { ActivityPaywallCard } from '../../components/activity-paywall-card/activity-paywall-card';
import { ManualActivityModal } from '../../components/manual-activity-modal/manual-activity-modal';

@Component({
  selector: 'app-physical-activity',
  imports: [
    TranslatePipe,
    GoogleFitConnectCard,
    ManualActivityCard,
    WearableConnectedCard,
    SyncFailedBanner,
    ActivityPaywallCard,
    ManualActivityModal,
  ],
  templateUrl: './physical-activity.html',
  styleUrl: './physical-activity.css',
})
export class PhysicalActivityView implements OnInit {
  protected readonly store    = inject(WearableStore);
  protected readonly iamStore = inject(IamStore);

  protected readonly showModal = signal<boolean>(false);

  readonly WearableStatus   = WearableStatus;
  readonly SubscriptionPlan = SubscriptionPlan;

  ngOnInit(): void {
    this.store.load();
  }

  get isPremium(): boolean {
    const plan = this.iamStore.currentUser()?.plan;
    return plan === SubscriptionPlan.PREMIUM || plan === SubscriptionPlan.PRO;
  }

  get wearableStatus(): WearableStatus | null {
    return this.store.connection()?.status ?? null;
  }

  onConnect(): void {
    this.store.connectGoogleFit();
  }

  onDisconnect(): void {
    this.store.disconnectWearable();
  }

  onSyncNow(): void {
    this.store.syncNow();
  }

  onOpenModal(): void {
    this.showModal.set(true);
  }

  onCloseModal(): void {
    this.showModal.set(false);
  }

  onPreviewCalories(event: { activityKey: string; durationMinutes: number }): void {
    this.store.previewCalories(event.activityKey, event.durationMinutes);
  }

  async onSaveActivity(event: { activityKey: string; durationMinutes: number }): Promise<void> {
    await this.store.logManualActivity(event.activityKey, event.durationMinutes);
    this.showModal.set(false);
  }
}
