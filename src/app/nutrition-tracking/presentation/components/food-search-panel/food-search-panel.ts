import { Component, computed, EventEmitter, inject, Output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { IamStore } from '../../../../iam/application/iam.store';
import { DietaryRestriction } from '../../../../iam/domain/model/dietary-restriction.enum';
import { NutritionStore } from '../../../application/nutrition.store';
import { FoodItem } from '../../../domain/model/food-item.entity';

/**
 * Right-column food search panel.
 *
 * Applies 400 ms debounce via {@link NutritionStore.searchFoods},
 * flags items conflicting with the user's active restrictions (T18),
 * and emits the selected food to the parent view for the add-food dialog.
 *
 * @author Mora Rivera, Joel Fernando
 */
@Component({
  selector: 'app-food-search-panel',
  imports: [TranslatePipe],
  templateUrl: './food-search-panel.html',
  styleUrl: './food-search-panel.css',
})
export class FoodSearchPanelComponent {

  protected nutritionStore = inject(NutritionStore);
  private   iamStore       = inject(IamStore);

  /** Emitted when the user clicks a non-restricted food result. */
  @Output() foodSelected = new EventEmitter<FoodItem>();

  /** User's active dietary restrictions. */
  private userRestrictions = computed(() =>
    this.iamStore.currentUser()?.restrictions as DietaryRestriction[] ?? []
  );

  /** Whether any search result conflicts with the user's restrictions. */
  protected hasAnyRestriction = computed(() =>
    this.nutritionStore.foodItems().some(f => f.isRestrictedFor(this.userRestrictions()))
  );

  /** Comma-separated list of restriction names that appear in results. */
  protected conflictingRestrictionNames = computed(() => {
    const set = new Set<string>();
    this.nutritionStore.foodItems().forEach(f => {
      f.conflictingRestrictions(this.userRestrictions())
       .forEach(r => set.add(r.toLowerCase().replace('_', ' ')));
    });
    return [...set].join(', ');
  });

  /** Whether a food item conflicts with user restrictions. */
  protected isRestricted(food: FoodItem): boolean {
    return food.isRestrictedFor(this.userRestrictions());
  }

  /** Returns conflicting restriction tags for display chips. */
  protected getConflictTags(food: FoodItem): string[] {
    return food.conflictingRestrictions(this.userRestrictions())
               .map(r => r.toLowerCase().replace('_free', '').replace('_', ' '));
  }

  /** Forwards input to the store's debounced search. */
  onSearchInput(event: Event): void {
    const query = (event.target as HTMLInputElement).value;
    this.nutritionStore.searchFoods(query);
  }

  /** Selects a food — restricted items are ignored. */
  onSelectFood(food: FoodItem): void {
    if (this.isRestricted(food)) return;
    this.foodSelected.emit(food);
  }
}
