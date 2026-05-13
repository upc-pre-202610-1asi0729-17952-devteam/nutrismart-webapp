import { Component, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

/**
 * Decorative chip indicating wearable device connection status.
 *
 * Renders green when connected, gray otherwise. No interaction — purely visual.
 */
@Component({
  selector: 'app-wearable-chip',
  imports: [TranslatePipe],
  templateUrl: './wearable-chip.html',
  styleUrl: './wearable-chip.css',
})
export class WearableChip {
  /** Whether a wearable device is currently connected. */
  readonly isConnected = input<boolean>(false);
}
