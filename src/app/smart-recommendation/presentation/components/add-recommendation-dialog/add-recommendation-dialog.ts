import { Component, computed, EventEmitter, inject, input, Output, signal } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { RecommendationCard } from '../../../infrastructure/recommendations-api';
import { MealType } from '../../../../nutrition-tracking/domain/model/meal-type.enum';
import { NutritionalRiskLevel } from '../../../../nutrition-tracking/domain/model/nutritional-risk-level.enum';

/** Payload emitted when the user confirms logging a recommendation. */
export interface AddRecommendationPayload {
  card:     RecommendationCard;
  mealType: MealType;
}

/**
 * Modal dialog for selecting a meal window before logging a recommendation card.
 *
 * Dumb component: receives card data and daily balance context as inputs,
 * emits a typed payload on confirm and a void signal on cancel.
 *
 * @param card            - Recommendation card to log.
 * @param currentConsumed - Calories already logged today (for impact indicator).
 * @param dailyGoal       - User's daily calorie target (for impact indicator).
 */
@Component({
  selector:    'app-add-recommendation-dialog',
  imports:     [TranslatePipe],
  templateUrl: './add-recommendation-dialog.html',
  styleUrl:    './add-recommendation-dialog.css',
})
export class AddRecommendationDialogComponent {

  card            = input.required<RecommendationCard>();
  currentConsumed = input<number>(0);
  dailyGoal       = input<number>(1800);

  /** @event confirm Emitted with the card and selected meal type when the user confirms. */
  @Output() confirm = new EventEmitter<AddRecommendationPayload>();

  /** @event cancel Emitted when the user dismisses the dialog. */
  @Output() cancel  = new EventEmitter<void>();

  private readonly translate = inject(TranslateService);

  protected readonly RiskLevel   = NutritionalRiskLevel;
  protected readonly MealType    = MealType;
  protected readonly allMealTypes: MealType[] = [
    MealType.BREAKFAST, MealType.LUNCH, MealType.SNACK, MealType.DINNER,
  ];

  protected selectedMealType = signal<MealType>(MealType.LUNCH);

  protected proteinGrams = computed(() =>
    parseFloat(this.card().protein.replace(/[^0-9.]/g, ''))
  );

  protected impactPercent = computed(() => {
    const goal = this.dailyGoal();
    if (goal <= 0) return 0;
    return Math.min(
      Math.round(((this.currentConsumed() + this.card().calories) / goal) * 100),
      150,
    );
  });

  protected impactLevel = computed((): NutritionalRiskLevel => {
    const pct = this.impactPercent();
    if (pct >= 100) return NutritionalRiskLevel.HIGH;
    if (pct >= 80)  return NutritionalRiskLevel.MODERATE;
    return NutritionalRiskLevel.SAFE;
  });

  /**
   * Returns the i18n label for a given meal type.
   *
   * @param mt - Meal type enum value.
   */
  protected getMealTypeLabel(mt: MealType): string {
    return this.translate.instant('nutrition.' + mt.toLowerCase());
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('dialog-backdrop')) {
      this.cancel.emit();
    }
  }

  onConfirm(): void {
    this.confirm.emit({ card: this.card(), mealType: this.selectedMealType() });
  }
}
