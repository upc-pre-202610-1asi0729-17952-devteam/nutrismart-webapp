import { DomainEvent } from '../../../shared/domain/domain-event';

/**
 * Fired when a wearable device sync completes successfully.
 *
 * Published by {@link WearableStore} after Google Fit data is pulled,
 * carrying the net active calories burned today.
 */
export class ActivitySynced extends DomainEvent {
  override readonly eventType = 'ActivitySynced';

  constructor(
    readonly userId:         number,
    readonly caloriesBurned: number,
    readonly syncedAt:       string,
  ) { super(); }
}
