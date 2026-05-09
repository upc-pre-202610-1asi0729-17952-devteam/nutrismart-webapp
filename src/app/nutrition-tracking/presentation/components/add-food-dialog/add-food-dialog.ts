import { Component, computed, EventEmitter, input, Output, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { FoodItem } from '../../../domain/model/food-item.entity';
import { MealType } from '../../../domain/model/meal-type.enum';

/**
 * Payload emitted when the user confirms adding a food to the log.
 */
export interface AddFoodPayload {
  food:      FoodItem;
  quantity:  number;
  mealType:  MealType;
  nutrients: { calories: number; protein: number; carbs: number; fat: number; fiber: number; sugar: number; };
}

/**
 * Modal dialog for configuring and confirming a meal entry.
 *
 * Shows food info, a quantity input that scales macros in real time,
 * a meal type selector, and a 4-cell macro preview grid (T20).
 *
 * @author Mora Rivera, Joel Fernando
 */
@Component({
  selector: 'app-add-food-dialog',
  imports: [TranslatePipe],
  templateUrl: './add-food-dialog.html',
  styleUrl: './add-food-dialog.css',
})
export class AddFoodDialogComponent {

  /** The food item to add. */
  food = input.required<FoodItem>();

  /** Pre-selected meal type (from the "+ Add food to X" button). */
  targetMealType = input<MealType>(MealType.LUNCH);

  /** Emitted with the full payload when the user confirms. */
  @Output() confirm = new EventEmitter<AddFoodPayload>();

  /** Emitted when the user cancels. */
  @Output() cancel = new EventEmitter<void>();

  protected mealTypes     = Object.values(MealType);
  protected selectedMealType: MealType = MealType.LUNCH;
  protected quantity = signal(100);

  /** Reactively scaled nutrients. */
  protected nutrients = computed(() =>
    this.food().getNutrientsForQuantity(this.quantity())
  );

  ngOnInit(): void {
    this.quantity.set(this.food().servingSize > 0 ? this.food().servingSize : 100);
    this.selectedMealType = this.targetMealType();
  }

  onQuantityChange(event: Event): void {
    const val = parseInt((event.target as HTMLInputElement).value);
    this.quantity.set(isNaN(val) || val <= 0 ? 1 : val);
  }

  onConfirm(): void {
    this.confirm.emit({
      food:      this.food(),
      quantity:  this.quantity(),
      mealType:  this.selectedMealType,
      nutrients: this.nutrients(),
    });
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('dialog-backdrop')) {
      this.cancel.emit();
    }
  }
}
