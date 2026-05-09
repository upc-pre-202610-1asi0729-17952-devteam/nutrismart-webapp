import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatChipsModule } from '@angular/material/chips';
import { TranslatePipe } from '@ngx-translate/core';
import { IamStore } from '../../../../iam/application/iam.store';
import { SubscriptionPlan } from '../../../../iam/domain/model/subscription-plan.enum';
import { MealType } from '../../../../nutrition-tracking/domain/model/meal-type.enum';
import { MacroKey, SmartScanStore } from '../../../application/smart-scan.store';

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
    TranslatePipe,
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
  private   router         = inject(Router);

  protected readonly MealType = MealType;

  protected selectedMealType = MealType.LUNCH;
  protected plateDragActive  = signal(false);
  protected menuDragActive   = signal(false);

  protected isBasic = computed(() => {
    const user = this.iamStore.currentUser();
    return user !== null && !user.isPro();
  });

  protected isPremium = computed(() => {
    const user = this.iamStore.currentUser();
    return user?.plan === SubscriptionPlan.PREMIUM;
  });

  protected readonly mealTypes = [
    { value: MealType.BREAKFAST, labelKey: 'nutrition.breakfast' },
    { value: MealType.LUNCH,     labelKey: 'nutrition.lunch' },
    { value: MealType.DINNER,    labelKey: 'nutrition.dinner' },
    { value: MealType.SNACK,     labelKey: 'nutrition.snack' },
  ];

  constructor() {
    // Reset and refresh nutrition data when navigating to /smart-scan so that
    // macroAlerts always reflects the current daily totals, not a cached state.
    this.router.events
      .pipe(
        filter(e => e instanceof NavigationEnd),
        filter(e => (e as NavigationEnd).urlAfterRedirects.startsWith('/smart-scan')),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        this.smartScanStore.reset();
        this.smartScanStore.refreshDailyTotals();
      });
  }

  ngOnInit(): void {
    this.smartScanStore.reset();
    this.smartScanStore.refreshDailyTotals();
  }

  // ─── Plate drop zone ──────────────────────────────────────────────────────

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

  // ─── Menu drop zone (Premium only) ───────────────────────────────────────

  onMenuDragOver(event: DragEvent): void {
    event.preventDefault();
    if (!this.isPremium()) return;
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
    if (!this.isPremium()) return;
    const file = event.dataTransfer?.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    await this._readAndScanMenu(file);
  }

  // ─── Upload / demo triggers ───────────────────────────────────────────────

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

  // ─── Plate result actions ─────────────────────────────────────────────────

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

  protected macroI18nKey(macro: MacroKey): string {
    const map: Record<MacroKey, string> = {
      calories: 'nutrition.calories',
      protein:  'nutrition.protein',
      carbs:    'nutrition.carbohydrates',
      fat:      'nutrition.fats',
      fiber:    'nutrition.fiber',
    };
    return map[macro];
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
