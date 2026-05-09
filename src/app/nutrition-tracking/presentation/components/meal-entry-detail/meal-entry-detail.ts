import { Component, computed, EventEmitter, inject, input, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { MealRecord } from '../../../domain/model/meal-record.entity';

/**
 * Dialog showing full nutritional detail for a logged meal entry.
 *
 * Opens when the user clicks on a meal row in any meal section.
 * Displays all macros and the logged timestamp. When {@link isEditable}
 * is true, exposes an edit mode to update the consumed quantity.
 *
 * @author Mora Rivera, Joel Fernando
 */
@Component({
  selector: 'app-meal-entry-detail',
  imports: [TranslatePipe, FormsModule],
  templateUrl: './meal-entry-detail.html',
  styleUrl: './meal-entry-detail.css',
})
export class MealEntryDetailComponent {
  /** The meal record to display. */
  entry = input.required<MealRecord>();

  /** Whether this entry falls within the 7-day editable window. */
  isEditable = input<boolean>(false);

  /** Emitted when the user closes the dialog. */
  @Output() close = new EventEmitter<void>();

  /** Emitted when the user confirms an edit with the new quantity. */
  @Output() editConfirm = new EventEmitter<{ id: number; quantity: number }>();

  private translate = inject(TranslateService);
  protected get currentLang(): string { return this.translate.currentLang ?? 'en'; }

  /** Whether the dialog is in edit mode. */
  protected editMode = signal(false);

  /** New quantity typed by the user in edit mode. */
  protected newQuantity = signal(0);

  /** Formatted time string from the loggedAt timestamp. */
  protected loggedTime = computed(() =>
    new Date(this.entry().loggedAt).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    }),
  );

  startEdit(): void {
    this.newQuantity.set(this.entry().quantity);
    this.editMode.set(true);
  }

  cancelEdit(): void {
    this.editMode.set(false);
  }

  confirmEdit(): void {
    const qty = this.newQuantity();
    if (qty <= 0) return;
    this.editConfirm.emit({ id: this.entry().id, quantity: qty });
    this.editMode.set(false);
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('dialog-backdrop')) {
      this.close.emit();
    }
  }
}
