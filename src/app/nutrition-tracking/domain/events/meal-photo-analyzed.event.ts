import { DomainEvent } from '../../../shared/domain/domain-event';

/**
 * Fired when a food-plate photo is successfully analyzed by the Vision API.
 *
 * Emitted by {@link PlateScanStore} after AI detection completes and at least
 * one food item is identified. The user must still confirm via ConfirmScanResult.
 */
export class MealPhotoAnalyzed extends DomainEvent {
  override readonly eventType = 'MealPhotoAnalyzed';

  constructor(
    readonly userId:            number,
    readonly itemsDetected:     string[],
    readonly estimatedCalories: number,
  ) { super(); }
}
