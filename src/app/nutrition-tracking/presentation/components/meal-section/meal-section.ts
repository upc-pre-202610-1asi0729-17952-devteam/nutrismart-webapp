import { Component, computed, EventEmitter, inject, input, Output } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { map, startWith } from 'rxjs';
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
  imports: [TranslatePipe],
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

  @Output() viewEntry = new EventEmitter<MealRecord>();

  private translate = inject(TranslateService);

  private readonly currentLang = toSignal(
    this.translate.onLangChange.pipe(
      map(e => e.lang),
      startWith(this.translate.currentLang ?? 'en'),
    ),
    { initialValue: this.translate.currentLang ?? 'en' },
  );

  /** Returns the translated meal name for the current language. */
  protected getMealLabel(): string {
    return this.translate.instant('nutrition.' + this.mealType().toLowerCase());
  }

  /** Returns the localized food name for a meal record. */
  protected getRecordName(record: MealRecord): string {
    return record.getLocalizedFoodName(this.currentLang());
  }

  /** Total kilocalories for this meal section. */
  protected totalCalories = computed(() => this.records().reduce((sum, r) => sum + r.calories, 0));

  /** Delegates remove action to the parent view. */
  onRemove(id: number): void {
    this.removeEntry.emit(id);
  }
}
