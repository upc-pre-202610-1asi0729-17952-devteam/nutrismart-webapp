import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { IamStore } from '../../../../iam/application/iam.store';
import { UserGoal } from '../../../../iam/domain/model/user-goal.enum';
import { NutritionStore } from '../../../../nutrition-tracking/application/nutrition.store';
import { PantryStore } from '../../../application/pantry.store';
import { IngredientCatalogItem } from '../../../domain/model/ingredient-catalog-item.entity';
import { RecipeSuggestion } from '../../../domain/model/recipe-suggestion.entity';

/**
 * Pantry view — route `/pantry`.
 *
 * Left panel: ingredient autocomplete selector + list + daily balance footer (T31).
 * Right panel: recipe suggestions with goal-type badges (T31).
 *
 * @author Del Aguila Del Aguila, Olenka Priscilla
 */
@Component({
  selector: 'app-pantry',
  imports: [
    TranslatePipe,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatChipsModule,
  ],
  templateUrl: './pantry.html',
  styleUrl: './pantry.css',
})
export class Pantry implements OnInit {
  protected iamStore        = inject(IamStore);
  protected pantryStore     = inject(PantryStore);
  private   nutritionStore  = inject(NutritionStore);
  private   translate       = inject(TranslateService);
  private   router          = inject(Router);

  protected readonly UserGoal = UserGoal;

  // ─── Autocomplete signals ─────────────────────────────────────────────────

  protected searchText    = signal<string>('');
  protected showDropdown  = signal<boolean>(false);
  protected selectedItem  = signal<IngredientCatalogItem | null>(null);

  protected filteredCatalog = computed(() => {
    const query = this.searchText().toLowerCase().trim();
    if (!query) return [];
    return this.pantryStore.catalog().filter(item => {
      const translated = this.translate.instant('pantry_items.' + item.nameKey).toLowerCase();
      return translated.includes(query);
    });
  });

  // ─── Computed signals ─────────────────────────────────────────────────────

  protected dailyProgressPct = computed(() => {
    const goal     = this.pantryStore.dailyGoal();
    const consumed = this.pantryStore.dailyConsumed();
    if (goal === 0) return 0;
    return Math.min(Math.round((consumed / goal) * 100), 100);
  });

  protected recipeSubtitle = computed(() => {
    const goal = this.pantryStore.userGoal();
    if (goal === UserGoal.MUSCLE_GAIN) {
      return this.translate.instant('pantry.recipes_ranked_protein');
    }
    const remaining = this.pantryStore.remainingCalories();
    const user      = this.iamStore.currentUser();
    const parts: string[] = [
      this.translate.instant('pantry.recipes_based_on'),
      this.translate.instant('pantry.recipes_filtered_deficit', { kcal: remaining }),
    ];
    if (user?.restrictions?.length) {
      parts.push(
        user.restrictions
          .map(r => this.translate.instant('restrictions.' + r))
          .join(' · '),
      );
    }
    return parts.join(' · ');
  });

  // ─── Lifecycle ────────────────────────────────────────────────────────────

  async ngOnInit(): Promise<void> {
    this.pantryStore.fetchCatalog();
    await Promise.all([
      this.nutritionStore.loadMealHistory(),
      this.pantryStore.fetchPantryItems(),
    ]);
  }

  // ─── Autocomplete handlers ────────────────────────────────────────────────

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchText.set(value);
    this.selectedItem.set(null);
    this.showDropdown.set(value.trim().length > 0);
  }

  onInputFocus(): void {
    if (this.searchText().trim().length > 0) {
      this.showDropdown.set(true);
    }
  }

  onInputBlur(): void {
    this.showDropdown.set(false);
  }

  onOptionMousedown(event: MouseEvent, item: IngredientCatalogItem): void {
    event.preventDefault();
    this.selectedItem.set(item);
    this.searchText.set(this.translate.instant('pantry_items.' + item.nameKey));
    this.showDropdown.set(false);
  }

  // ─── Event handlers ───────────────────────────────────────────────────────

  async onAddIngredient(): Promise<void> {
    const item = this.selectedItem();
    if (!item) return;
    const displayName = this.translate.instant('pantry_items.' + item.nameKey);
    await this.pantryStore.addPantryItem(displayName, item.category, 100, item.caloriesPer100g, item.nameKey);
    this.searchText.set('');
    this.selectedItem.set(null);
    this.showDropdown.set(false);
  }

  async onRemoveItem(itemId: number): Promise<void> {
    await this.pantryStore.deletePantryItem(itemId);
  }

  onAddToLog(recipe: RecipeSuggestion): void {
    this.router.navigate(['/nutrition/log'], {
      state: {
        fromRecipe: {
          id:       recipe.id,
          name:     recipe.name,
          calories: recipe.calories,
          protein:  recipe.protein,
          carbs:    recipe.carbs,
          fat:      recipe.fat,
        },
      },
    });
  }

  categoryI18nKey(category: string): string {
    return 'ingredient_categories.' + category.toLowerCase().replaceAll(' ', '_');
  }

  recipeCalorieImpact(recipe: RecipeSuggestion): { severity: 'warning' | 'danger'; percent: number } | null {
    const goal = this.pantryStore.dailyGoal();
    if (goal === 0) return null;
    const percent = Math.round(((this.pantryStore.dailyConsumed() + recipe.calories) / goal) * 100);
    if (percent >= 100) return { severity: 'danger', percent };
    if (percent >= 80)  return { severity: 'warning', percent };
    return null;
  }

  resolvedIngredients(recipe: RecipeSuggestion): string {
    return recipe.ingredients
      .map(key => {
        const translated = this.translate.instant(`pantry_items.${key}`);
        return translated !== `pantry_items.${key}` ? translated : key;
      })
      .join(', ');
  }
}
