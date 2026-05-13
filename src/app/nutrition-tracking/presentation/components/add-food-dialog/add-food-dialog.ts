import { Component, computed, EventEmitter, inject, input, OnInit, Output, signal } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { FoodItem } from '../../../domain/model/food-item.entity';
import { MealType } from '../../../domain/model/meal-type.enum';
import { NutritionalRiskLevel } from '../../../domain/model/nutritional-risk-level.enum';

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
export class AddFoodDialogComponent implements OnInit {

  /** The food item to add. */
  food = input.required<FoodItem>();

  /** Pre-selected meal type (from the "+ Add food to X" button). */
  targetMealType = input<MealType>(MealType.LUNCH);

  /** Calories already consumed for the selected date — used for impact indicator. */
  currentConsumed = input<number>(0);

  /** User's daily calorie goal — used for impact indicator. */
  dailyGoal = input<number>(1800);

  /** Meal types available to select (time-gated by parent for today). */
  availableMealTypes = input<MealType[]>([MealType.BREAKFAST, MealType.LUNCH, MealType.SNACK, MealType.DINNER]);

  /** Emitted with the full payload when the user confirms. */
  @Output() confirm = new EventEmitter<AddFoodPayload>();

  /** Emitted when the user cancels. */
  @Output() cancel = new EventEmitter<void>();

  private translate = inject(TranslateService);

  protected get currentLang(): string { return this.translate.currentLang ?? 'en'; }

  protected readonly RiskLevel = NutritionalRiskLevel;
  protected selectedMealType: MealType = MealType.LUNCH;
  protected quantity = signal(100);

  /** Returns the translated label for a given meal type. */
  protected getMealTypeLabel(mt: MealType): string {
    return this.translate.instant('nutrition.' + mt.toLowerCase());
  }

  /** Returns the translated label for the pre-selected target meal type. */
  protected getTargetMealLabel(): string {
    return this.translate.instant('nutrition.' + this.targetMealType().toLowerCase());
  }

  /** Reactively scaled nutrients. */
  protected nutrients = computed(() =>
    this.food().getNutrientsForQuantity(this.quantity())
  );

  /** Projected % of daily goal after adding this food (capped at 150%). */
  protected impactPercent = computed(() => {
    const goal = this.dailyGoal();
    if (goal <= 0) return 0;
    return Math.min(Math.round(((this.currentConsumed() + this.nutrients().calories) / goal) * 100), 150);
  });

  /** Nutritional risk of adding this food given the current daily consumption. */
  protected impactLevel = computed((): NutritionalRiskLevel =>
    this.nutrients().classifyRisk(this.dailyGoal(), this.currentConsumed())
  );

  ngOnInit(): void {
    this.quantity.set(this.food().servingSize > 0 ? this.food().servingSize : 100);
    const preferred = this.targetMealType();
    this.selectedMealType = this.availableMealTypes().includes(preferred)
      ? preferred
      : this.availableMealTypes()[0];
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
