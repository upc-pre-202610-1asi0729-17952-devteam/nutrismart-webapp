import { Component, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

/**
 * Interactive chip indicating wearable device connection status.
 *
 * Renders green when connected, gray otherwise. Clicking it emits {@link clicked}
 * so the host can open the Google Health sync dialog.
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

  /** Emitted when the user activates the chip (click / Enter / Space). */
  readonly clicked = output<void>();

  onActivate(): void {
    this.clicked.emit();
  }
}
