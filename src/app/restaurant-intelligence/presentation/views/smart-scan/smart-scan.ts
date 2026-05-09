import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatChipsModule } from '@angular/material/chips';
import { IamStore } from '../../../../iam/application/iam.store';
import { SubscriptionPlan } from '../../../../iam/domain/model/subscription-plan.enum';
import { MealType } from '../../../../nutrition-tracking/domain/model/meal-type.enum';
import { SmartScanStore } from '../../application/smart-scan.store';

/**
 * Smart Scan view — route `/smart-scan`.
 *
 * Manages all scan states in a single component using {@link SmartScanStore}
 * signals: landing (T27), analyzing/plate-result/plate-invalid (T28),
 * and menu-result (T29).
 *
 * @author Del Aguila Del Aguila, Olenka Priscilla
 */
@Component({
  selector: 'app-smart-scan',
  imports: [
    FormsModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatFormFieldModule,
    MatExpansionModule,
    MatChipsModule,
  ],
  templateUrl: './smart-scan.html',
  styleUrl: './smart-scan.css',
})
export class SmartScan {
  protected iamStore       = inject(IamStore);
  protected smartScanStore = inject(SmartScanStore);

  protected readonly MealType = MealType;

  /** Meal type selected by the user before confirming scan log. */
  protected selectedMealType = MealType.LUNCH;

  /** Computed: current user is Basic plan (shows paywall). */
  protected isBasic = computed(() => {
    const user = this.iamStore.currentUser();
    return user !== null && !user.isPro();
  });

  /** Computed: current user is Premium. */
  protected isPremium = computed(() => {
    const user = this.iamStore.currentUser();
    return user?.plan === SubscriptionPlan.PREMIUM;
  });

  protected readonly mealTypes = [
    { value: MealType.BREAKFAST, label: 'Breakfast' },
    { value: MealType.LUNCH,     label: 'Lunch' },
    { value: MealType.DINNER,    label: 'Dinner' },
    { value: MealType.SNACK,     label: 'Snack' },
  ];

  // ─── Image Upload / Demo Triggers ────────────────────────────────────────

  /** Simulates uploading a plate image (demo: triggers scan with a stub base64). */
  async onUploadPlate(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file  = input?.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      await this.smartScanStore.scanFoodPlate(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  /** Demo: triggers plate scan with a placeholder image. */
  async onTakePhotoPlate(): Promise<void> {
    await this.smartScanStore.scanFoodPlate('demo-plate-base64');
  }

  /** Simulates uploading a menu image. */
  async onUploadMenu(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file  = input?.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      await this.smartScanStore.scanMenuPhoto(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  /** Demo: triggers menu scan with a placeholder image. */
  async onTakePhotoMenu(): Promise<void> {
    await this.smartScanStore.scanMenuPhoto('demo-menu-base64');
  }

  // ─── Plate Result Actions ─────────────────────────────────────────────────

  onQuantityChange(itemId: number, event: Event): void {
    const value = parseFloat((event.target as HTMLInputElement).value);
    if (!isNaN(value) && value > 0) {
      this.smartScanStore.updateScannedItemQuantity(itemId, value);
    }
  }

  onRemoveItem(itemId: number): void {
    this.smartScanStore.removeScannedItem(itemId);
  }

  async onConfirmLog(): Promise<void> {
    await this.smartScanStore.confirmPlateScan(this.selectedMealType);
  }

  onCancel(): void {
    this.smartScanStore.reset();
  }
}
