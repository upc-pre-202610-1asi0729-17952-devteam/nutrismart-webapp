import { Component, computed, EventEmitter, input, Output } from '@angular/core';
import { MealType } from '../../../domain/model/meal-type.enum';
import { MealRecord } from '../../../domain/model/meal-record.entity';

/**
 * Displays a single meal section (Breakfast, Lunch, Snack, or Dinner)
 * with its logged entries, remove buttons, and an "Add food" footer link.
 *
 * Shows a MealSkipped badge when `isSkipped` is true (T21).
 *
 * @author Mora Rivera, Joel Fernando
 */
@Component({
  selector: 'app-meal-section',
  templateUrl: './meal-section.html',
  styleUrl: './meal-section.css',
})
export class MealSectionComponent {
  /** The meal window type (Breakfast, Lunch, Snack, Dinner). */
  mealType = input.required<MealType>();

  /** Dot colour for the meal header. */
  color = input<string>('#2d9e8f');

  /** Logged meal records for this meal window. */
  records = input<MealRecord[]>([]);

  /** When true, renders the MealSkipped state instead of the entries list (T21). */
  isSkipped = input<boolean>(false);

  /** Emitted when the user clicks the remove button on an entry. */
  @Output() removeEntry = new EventEmitter<number>();

  /** Emitted when the user clicks "+ Add food to [Meal]". */
  @Output() addFood = new EventEmitter<MealType>();

  @Output() viewEntry = new EventEmitter<MealRecord>();

  /** Total kilocalories for this meal section. */
  protected totalCalories = computed(() => this.records().reduce((sum, r) => sum + r.calories, 0));

  /** Delegates remove action to the parent view. */
  onRemove(id: number): void {
    this.removeEntry.emit(id);
  }
}
