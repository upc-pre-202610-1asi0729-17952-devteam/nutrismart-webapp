import { Component, computed, EventEmitter, input, Output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { MealRecord } from '../../../domain/model/meal-record.entity';

/**
 * Dialog showing full nutritional detail for a logged meal entry.
 *
 * Opens when the user clicks on a meal row in any meal section.
 * Displays all macros and the logged timestamp.
 *
 * @author Mora Rivera, Joel Fernando
 */
@Component({
  selector: 'app-meal-entry-detail',
  imports: [TranslatePipe],
  templateUrl: './meal-entry-detail.html',
  styleUrl: './meal-entry-detail.css',
})
export class MealEntryDetailComponent {
  /** The meal record to display. */
  entry = input.required<MealRecord>();

  /** Emitted when the user closes the dialog. */
  @Output() close = new EventEmitter<void>();

  /** Formatted time string from the loggedAt timestamp. */
  protected loggedTime = computed(() =>
    new Date(this.entry().loggedAt).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    }),
  );

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('dialog-backdrop')) {
      this.close.emit();
    }
  }
}
