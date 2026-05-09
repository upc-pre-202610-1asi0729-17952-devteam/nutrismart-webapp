import { Component, computed, inject, OnInit, signal } from '@angular/core';
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
import { SmartScanStore } from '../../../application/smart-scan.store';

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
export class SmartScan implements OnInit {
  protected iamStore       = inject(IamStore);
  protected smartScanStore = inject(SmartScanStore);

  protected readonly MealType = MealType;

  /** Meal type selected by the user before confirming scan log. */
  protected selectedMealType = MealType.LUNCH;

  /** Whether a file is being dragged over the plate drop zone. */
  protected plateDragActive = signal(false);

  /** Whether a file is being dragged over the menu drop zone. */
  protected menuDragActive = signal(false);

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

  ngOnInit(): void {
    this.smartScanStore.reset();
  }

  // ─── Plate drop zone drag events ─────────────────────────────────────────

  onPlateDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.plateDragActive.set(true);
  }

  onPlateDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.plateDragActive.set(false);
  }

  async onPlateDrop(event: DragEvent): Promise<void> {
    event.preventDefault();
    event.stopPropagation();
    this.plateDragActive.set(false);
    const file = event.dataTransfer?.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    await this._readAndScanPlate(file);
  }

  // ─── Menu drop zone drag events ───────────────────────────────────────────

  onMenuDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.menuDragActive.set(true);
  }

  onMenuDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.menuDragActive.set(false);
  }

  async onMenuDrop(event: DragEvent): Promise<void> {
    event.preventDefault();
    event.stopPropagation();
    this.menuDragActive.set(false);
    const file = event.dataTransfer?.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    await this._readAndScanMenu(file);
  }

  // ─── Image Upload / Demo Triggers ─────────────────────────────────────────

  async onUploadPlate(event: Event): Promise<void> {
    const file = (event.target as HTMLInputElement)?.files?.[0];
    if (!file) return;
    await this._readAndScanPlate(file);
  }

  async onTakePhotoPlate(): Promise<void> {
    await this.smartScanStore.scanFoodPlate('demo-plate-base64');
  }

  async onUploadMenu(event: Event): Promise<void> {
    const file = (event.target as HTMLInputElement)?.files?.[0];
    if (!file) return;
    await this._readAndScanMenu(file);
  }

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

  // ─── Private helpers ──────────────────────────────────────────────────────

  private _readAndScanPlate(file: File): Promise<void> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async () => {
        await this.smartScanStore.scanFoodPlate(reader.result as string);
        resolve();
      };
      reader.readAsDataURL(file);
    });
  }

  private _readAndScanMenu(file: File): Promise<void> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async () => {
        await this.smartScanStore.scanMenuPhoto(reader.result as string);
        resolve();
      };
      reader.readAsDataURL(file);
    });
  }
}
