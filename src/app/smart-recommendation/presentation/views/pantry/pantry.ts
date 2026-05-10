import { Component, computed, inject, OnInit } from '@angular/core';
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
import { PantryStore } from '../../../application/pantry.store';
import { RecipeSuggestion } from '../../../domain/model/recipe-suggestion.entity';

/**
 * Pantry view — route `/pantry`.
 *
 * Left panel: ingredient list + search input with daily balance footer (T31).
 * Right panel: recipe suggestions with goal-type badges (T31).
 * Handles empty-pantry state with instructional message.
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
  protected iamStore    = inject(IamStore);
  protected pantryStore = inject(PantryStore);
  private   translate   = inject(TranslateService);

  protected readonly UserGoal = UserGoal;

  /** Text typed into the search input. */
  protected searchText = '';

  /** Progress bar value: consumed / goal as percentage (0-100). */
  protected dailyProgressPct = computed(() => {
    const goal     = this.pantryStore.dailyGoal();
    const consumed = this.pantryStore.dailyConsumed();
    if (goal === 0) return 0;
    return Math.min(Math.round((consumed / goal) * 100), 100);
  });

  /** Subtitle text for the recipe panel, depending on goal type. */
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

  async ngOnInit(): Promise<void> {
    await this.pantryStore.fetchPantryItems();
  }

  // ─── Event Handlers ───────────────────────────────────────────────────────

  async onAddIngredient(): Promise<void> {
    const text = this.searchText.trim();
    if (!text) return;
    await this.pantryStore.addPantryItem(text, 'Other', 100, 100);
    this.searchText = '';
  }

  async onRemoveItem(itemId: number): Promise<void> {
    await this.pantryStore.deletePantryItem(itemId);
  }

  onAddToLog(recipeId: number): void {
    // Navigates to /nutrition/log — wired when NutritionStore integration is complete.
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
