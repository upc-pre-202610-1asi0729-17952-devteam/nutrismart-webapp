import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DecimalPipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonToggleGroup, MatButtonToggle } from '@angular/material/button-toggle';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { MetabolicStore } from '../../../application/metabolic.store';
import { IamStore } from '../../../../iam/application/iam.store';
import { BmiCategory } from '../../../domain/model/body-metric.entity';

/**
 * Main Body Progress view — route `/body-progress/progress`.
 *
 * Orchestrates:
 * - 4 metric cards: current weight, BMI+badge, BMR/TDEE (WEIGHT_LOSS) or
 *   % Body Fat/Lean Mass (MUSCLE_GAIN) (T38)
 * - Weight Evolution SVG chart with MatButtonToggle 7/30/90 days (T39)
 * - Dashed pink goal reference line + Edit goal panel trigger (T39)
 * - Log History table (last 3 entries) + View all link (T40)
 * - Live BMI/TDEE preview while typing a weight value (WA_BP_Registrar_peso)
 * - Inline validation errors on Log weight and Set goal weight (WA_BP_Error)
 * - Set goal weight right panel (replaces Update height when active) (T40)
 * - Body Composition section for MUSCLE_GAIN users (T41)
 * - 14-day staleness banner (T38)
 *
 * @author Espinoza Cruz, Angela Milagros
 */
@Component({
  selector: 'app-body-progress',
  imports: [DecimalPipe, NgClass, FormsModule, MatButtonToggleGroup, MatButtonToggle, TranslatePipe],
  templateUrl: './body-progress.html',
  styleUrl: './body-progress.css',
})
export class BodyProgressView implements OnInit {
  protected store     = inject(MetabolicStore);
  protected iamStore  = inject(IamStore);
  private translate   = inject(TranslateService);
  private router      = inject(Router);

  // ─── Right panel state ────────────────────────────────────────────────────

  /**
   * Controls which secondary right panel is shown:
   * - 'height' → Update height (default)
   * - 'goal'   → Set goal weight (activated by "Edit goal →" in the chart)
   *
   * The Log weight panel is always visible regardless of this value.
   */
  protected activeSecondaryPanel = signal<'height' | 'goal'>('height');

  // ─── Log weight form ──────────────────────────────────────────────────────

  /** Raw string from the Log weight input. */
  protected weightInput = signal<string>('');

  /** Inline validation error for the Log weight input. Empty string = no error. */
  protected weightError = signal<string>('');

  // ─── Update height form ───────────────────────────────────────────────────

  /** Raw string from the Update height input. */
  protected heightInput = signal<string>('');

  // ─── Set goal weight panel ────────────────────────────────────────────────

  /**
   * Two-way bound via [(ngModel)] — using a plain property instead of a signal
   * avoids Angular's [value] re-render loop on number inputs that caused the
   * field to reject mid-keystroke input.
   */
  protected goalWeightInputModel = '';

  /** Inline validation error for the goal weight input. Empty string = no error. */
  protected goalWeightError = signal<string>('');

  // ─── Body composition inputs ──────────────────────────────────────────────

  /**
   * Plain properties bound via [(ngModel)] for the same reason as
   * goalWeightInputModel: number inputs with [value]+signal cause Angular to
   * reset the DOM value mid-keystroke, making the field unresponsive.
   */
  protected waistInputModel = '';
  protected neckInputModel  = '';

  // ─── Computed ─────────────────────────────────────────────────────────────

  /**
   * True when the user has typed something in the Log weight input.
   * Drives the preview banner and Cancel button visibility.
   */
  protected isWeightTyping = computed(() => this.weightInput().trim().length > 0);

  /**
   * Live BMI and TDEE preview computed from the typed weight value.
   * Null when the input is empty or invalid.
   *
   * Shown as: "Preview: BMI → {bmi} · TDEE → {tdee} kcal/day"
   * Uses current metric's height for BMI and Mifflin-St Jeor × 1.55 for TDEE.
   */
  protected weightPreview = computed<{ bmi: number; tdee: number } | null>(() => {
    const raw = parseFloat(this.weightInput());
    if (!raw || raw <= 0 || raw > 500) return null;
    const heightCm = this.store.currentMetric()?.heightCm ?? 163;
    const h    = heightCm / 100;
    const bmi  = Math.round((raw / (h * h)) * 10) / 10;
    const bmr  = Math.round(10 * raw + 6.25 * heightCm - 161);
    const tdee = Math.round(bmr * 1.55);
    return { bmi, tdee };
  });

  /**
   * True when the Log weight input has content that cannot be saved
   * (e.g. non-positive or out-of-range value).
   */
  protected weightInputInvalid = computed(() => {
    const raw = parseFloat(this.weightInput());
    return this.weightInput().trim().length > 0 && (isNaN(raw) || raw <= 0 || raw > 500);
  });

  /**
   * Returns `true` when the goal weight input value fails validation.
   *
   * Implemented as a getter (not a computed signal) because it reads a plain
   * property (`goalWeightInputModel`). Angular re-evaluates getters on every
   * CD cycle triggered by other signal changes, keeping the template in sync.
   */
  protected get goalInputInvalid(): boolean {
    const raw     = parseFloat(this.goalWeightInputModel);
    const current = this.store.currentMetric()?.weightKg ?? 0;
    if (!this.goalWeightInputModel.trim()) return false;
    if (isNaN(raw) || raw <= 0) return true;
    if (!this.store.isMuscleGain() && raw >= current) return true;
    return false;
  }

  /** Formatted projected achievement date (e.g. "August 14, 2026"). */
  protected formattedProjectedDate = computed(() => {
    const date = this.store.currentMetric()?.projectedAchievementDate;
    if (!date) return this.translate.instant('body_progress.not_set');
    const lang = this.translate.currentLang ?? 'en';
    return new Date(date).toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US', {
      month: 'long', day: 'numeric', year: 'numeric',
    });
  });

  /** Short label shown inside the BMI badge pill (e.g. "Normal", not "Normal weight"). */
  protected bmiBadgeLabel = computed(() => {
    if (this.bmiOutdated()) return this.translate.instant('body_progress.bmi_outdated');
    const cat = this.store.currentMetric()?.bmiCategory();
    if (!cat) return '';
    return cat === BmiCategory.NORMAL
      ? this.translate.instant('body_progress.bmi_normal')
      : cat;
  });

  /** CSS class for the BMI WHO-category badge. */
  protected bmiCategoryClass = computed(() => {
    const cat = this.store.currentMetric()?.bmiCategory();
    switch (cat) {
      case BmiCategory.NORMAL:      return 'badge--green';
      case BmiCategory.OVERWEIGHT:  return 'badge--orange';
      case BmiCategory.OBESE:       return 'badge--red';
      case BmiCategory.UNDERWEIGHT: return 'badge--blue';
      default:                      return 'badge--green';
    }
  });

  /** Whether BMI may be inaccurate due to stale data. */
  protected bmiOutdated = computed(() => this.store.isStale());

  onChangeGoal(): void {
    this.router.navigate(['/body-progress', 'change-goal']);
  }

  async ngOnInit(): Promise<void> {
    await this.store.initialise();
  }

  // ─── Date range toggle (T39) ──────────────────────────────────────────────

  async selectDays(days: 7 | 30 | 90): Promise<void> {
    await this.store.loadHistory(days);
  }

  // ─── Log weight actions ───────────────────────────────────────────────────

  /** Scrolls focus to the Log weight panel (header button). */
  onOpenLogWeight(): void {
    this.weightInput.set('');
    this.weightError.set('');
  }

  /**
   * Validates the typed weight value and shows inline error if invalid.
   * On success saves via the store and clears the input.
   *
   * Validation (WA_BP_Error): must be a positive number ≤ 500.
   */
  async onSaveWeight(): Promise<void> {
    const val = parseFloat(this.weightInput());

    if (!this.weightInput().trim() || isNaN(val) || val <= 0) {
      this.weightError.set(this.translate.instant('body_progress.error_weight_positive'));
      return;
    }
    if (val > 500) {
      this.weightError.set(this.translate.instant('body_progress.error_weight_max'));
      return;
    }

    this.weightError.set('');
    await this.store.logWeight(val);
    this.weightInput.set('');
  }

  /** Clears the Log weight input and resets its error state. */
  onCancelWeight(): void {
    this.weightInput.set('');
    this.weightError.set('');
  }

  /** Clears error on every keystroke so the user gets immediate feedback. */
  onWeightInputChange(value: string): void {
    this.weightInput.set(value);
    this.weightError.set('');
  }

  // ─── Update height actions ────────────────────────────────────────────────

  /** Switches secondary panel to "Update height". */
  onOpenUpdateHeight(): void {
    this.activeSecondaryPanel.set('height');
    this.goalWeightInputModel = '';
    this.goalWeightError.set('');
  }

  /**
   * Saves the new height. BMI is recalculated synchronously via Signals.
   */
  async onUpdateHeight(): Promise<void> {
    const val = parseFloat(this.heightInput());
    if (!val || val <= 0 || val > 300) return;
    await this.store.updateHeight(val);
    this.heightInput.set('');
  }

  // ─── Set goal weight actions (T40, WA_BP_Error) ───────────────────────────

  /**
   * Opens the "Set goal weight" right panel and pre-fills the existing target.
   * Replaces the "Update height" panel in the right column.
   */
  onOpenGoalPanel(): void {
    const current = this.store.currentMetric();
    // Pre-fill existing target weight so the user can see and adjust it
    this.goalWeightInputModel =
      current?.targetWeightKg && current.targetWeightKg > 0
        ? current.targetWeightKg.toString()
        : '';
    this.goalWeightError.set('');
    this.activeSecondaryPanel.set('goal');
  }

  /** Dismisses the Set goal weight panel and returns to Update height. */
  onCancelGoal(): void {
    this.activeSecondaryPanel.set('height');
    this.goalWeightInputModel = '';
    this.goalWeightError.set('');
  }

  /**
   * Validates the target weight and saves it via the store.
   *
   * Validation (WA_BP_Error):
   * - Must be a positive number.
   * - For WEIGHT_LOSS: must be strictly below the current weight.
   */
  async onSaveGoal(): Promise<void> {
    const val     = parseFloat(this.goalWeightInputModel);
    const current = this.store.currentMetric()?.weightKg ?? 0;

    if (!this.goalWeightInputModel.trim() || isNaN(val) || val <= 0) {
      this.goalWeightError.set(this.translate.instant('body_progress.error_weight_invalid'));
      return;
    }

    if (!this.store.isMuscleGain() && val >= current) {
      this.goalWeightError.set(
        this.translate.instant('body_progress.error_goal_below_current', { current }),
      );
      return;
    }

    this.goalWeightError.set('');
    await this.store.setTargetWeight(val);
    this.activeSecondaryPanel.set('height');
    this.goalWeightInputModel = '';
  }

  /** Clears the goal error on every model change (ngModel fires this). */
  onGoalModelChange(): void {
    this.goalWeightError.set('');
  }

  // ─── Body composition actions (T41) ──────────────────────────────────────

  async onCalculateComposition(): Promise<void> {
    const waist = parseFloat(this.waistInputModel);
    const neck  = parseFloat(this.neckInputModel);
    if (!waist || !neck || waist <= 0 || neck <= 0) return;
    await this.store.updateBodyComposition(waist, neck);
    this.waistInputModel = '';
    this.neckInputModel  = '';
  }

  // ─── History formatting ───────────────────────────────────────────────────

  formatHistoryDate(isoDate: string): string {
    const d      = new Date(isoDate);
    const today  = new Date();
    const lang   = this.translate.currentLang ?? 'en';
    const locale = lang === 'es' ? 'es-ES' : 'en-US';
    const formatted = d.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
    if (d.toDateString() === today.toDateString()) {
      return `${this.translate.instant('nutrition.date_today')}, ${formatted}`;
    }
    return formatted;
  }

  formatDelta(delta: number): string {
    if (delta === 0) return '—';
    const sign = delta > 0 ? '+' : '';
    return `${sign}${delta.toFixed(1)} kg`;
  }

  isDeltaPositive(delta: number): boolean {
    return delta > 0;
  }
}
