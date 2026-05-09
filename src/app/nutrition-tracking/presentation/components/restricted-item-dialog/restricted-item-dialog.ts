import { Component, computed, EventEmitter, inject, input, Output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { IamStore } from '../../../../iam/application/iam.store';
import { DietaryRestriction } from '../../../../iam/domain/model/dietary-restriction.enum';
import { FoodItem } from '../../../domain/model/food-item.entity';

/**
 * Modal dialog shown when a user selects a food that conflicts with their
 * active dietary restrictions (RestrictedItemBlocked event — T20).
 *
 * @author Mora Rivera, Joel Fernando
 */
@Component({
  selector: 'app-restricted-item-dialog',
  imports: [TranslatePipe],
  templateUrl: './restricted-item-dialog.html',
  styleUrl: './restricted-item-dialog.css',
})
export class RestrictedItemDialogComponent {

  /** The restricted food item. */
  food = input.required<FoodItem>();

  /** Emitted when the user dismisses the dialog. */
  @Output() close = new EventEmitter<void>();

  private iamStore = inject(IamStore);

  /** Human-readable list of conflicting restriction names. */
  protected conflictNames = computed(() => {
    const userRestrictions = this.iamStore.currentUser()?.restrictions as DietaryRestriction[] ?? [];
    return this.food()
      .conflictingRestrictions(userRestrictions)
      .map(r => r.toLowerCase().replace('_free', '').replace('_', ' '))
      .join(', ');
  });

  /** Human-readable list of all active food restrictions. */
  protected restrictionNames = computed(() =>
    this.food().restrictions
      .join(', ')
      .toLowerCase()
      .replace(/_free/g, '-free')
      .replace(/_/g, ' ')
  );

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('dialog-backdrop')) {
      this.close.emit();
    }
  }
}
