import { Component, computed, HostListener, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonToggleChange, MatButtonToggleGroup, MatButtonToggle } from '@angular/material/button-toggle';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

const WEIGHT_MAX_KG = 500;
const MIN_GOAL_KG   = 30;
const WAIST_MIN_CM  = 30;
const WAIST_MAX_CM  = 200;
import { MetabolicStore } from '../../../application/metabolic.store';
import { IamStore } from '../../../../iam/application/iam.store';
import { BodyMetric, BmiCategory } from '../../../domain/model/body-metric.entity';

/**
 * Main Body Progress view — route `/body-progress/progress`.
 *
 * Single responsibility: execute UpdateBodyMetrics and display the resulting
 * read models (Weight History Chart, BMI Result, Updated Caloric Target View).
 *
 * @author Espinoza Cruz, Angela Milagros
 */
@Component({
  selector: 'app-body-progress',
  imports: [RouterLink, DecimalPipe, NgClass, FormsModule, MatButtonToggleGroup, MatButtonToggle, TranslatePipe],
  templateUrl: './body-progress.html',
  styleUrl: './body-progress.css',
})
export class BodyProgressView implements OnInit {
  protected store    = inject(MetabolicStore);
  protected iamStore = inject(IamStore);
  private translate  = inject(TranslateService);

  // ─── Log weight modal ─────────────────────────────────────────────────────

  protected showLogModal = signal<boolean>(false);
  protected weightInput  = signal<string>('');
  protected weightError  = signal<string>('');

  // ─── Inline goal weight editing ───────────────────────────────────────────

  protected isEditingGoal  = signal<boolean>(false);
  protected goalInputModel = signal<string>('');
  protected goalInputError = signal<string>('');

  protected showGoalAutoSetModal = signal<boolean>(false);

  // ─── Composition update modal ─────────────────────────────────────────────

  protected showCompositionModal  = signal<boolean>(false);
  protected compositionMode       = signal<'A' | 'B' | 'C'>('A');
  protected compositionWaistCm    = signal<string>('');
  protected compositionPantSize   = signal<number | null>(null);
  protected compositionVisualLevel = signal<number | null>(null);

  protected readonly pantSizes = [
    { size: 26, waistCm: 66 },
    { size: 28, waistCm: 71 },
    { size: 30, waistCm: 76 },
    { size: 32, waistCm: 81 },
    { size: 34, waistCm: 87 },
    { size: 36, waistCm: 92 },
    { size: 38, waistCm: 97 },
  ];

  protected readonly visualLevels = [
    { key: 'onboarding.visual_very_lean',  rangeKey: 'onboarding.visual_range_very_lean',  override: 10.5 },
    { key: 'onboarding.visual_lean',       rangeKey: 'onboarding.visual_range_lean',       override: 15.5 },
    { key: 'onboarding.visual_average',    rangeKey: 'onboarding.visual_range_average',    override: 20.5 },
    { key: 'onboarding.visual_overweight', rangeKey: 'onboarding.visual_range_overweight', override: 25.5 },
    { key: 'onboarding.visual_obese',      rangeKey: 'onboarding.visual_range_obese',      override: 32.0 },
  ];

  protected compositionValid = computed(() => {
    const mode = this.compositionMode();
    if (mode === 'A') {
      const v = parseFloat(this.compositionWaistCm());
      return !isNaN(v) && v >= WAIST_MIN_CM && v <= WAIST_MAX_CM;
    }
    if (mode === 'B') return this.compositionPantSize() !== null;
    return this.compositionVisualLevel() !== null;
  });

  // ─── History entry edit state ─────────────────────────────────────────────

  protected editingMetricId  = signal<number | string | null>(null);
  protected editWeightInput  = signal<string>('');
  protected editWeightError  = signal<string>('');

  // ─── Tooltip state ────────────────────────────────────────────────────────

  protected activeTooltip = signal<'bmi' | 'bmr' | 'tdee' | 'body_fat' | 'lean_mass' | 'lean_bulk' | null>(null);

  // ─── Computed ─────────────────────────────────────────────────────────────

  protected isWeightTyping = computed(() => this.weightInput().trim().length > 0);

  /**
   * Live BMI/TDEE preview — delegates to BodyMetric entity methods to avoid
   * duplicating the Mifflin-St Jeor formula.
   */
  protected weightPreview = computed<{ bmi: number; tdee: number } | null>(() => {
    const raw      = parseFloat(this.weightInput());
    if (!raw || raw <= 0 || raw > WEIGHT_MAX_KG) return null;
    const heightCm = this.store.currentMetric()?.heightCm;
    if (!heightCm) return null;
    const temp = new BodyMetric({ id: 0, userId: 0, weightKg: raw, heightCm, loggedAt: new Date().toISOString() });
    return { bmi: temp.bmi(), tdee: temp.tdee() };
  });

  protected weightInputInvalid = computed(() => {
    const raw = parseFloat(this.weightInput());
    return this.weightInput().trim().length > 0 && (isNaN(raw) || raw <= 0 || raw > WEIGHT_MAX_KG);
  });

  protected readonly goalInputInvalid = computed(() => {
    const val = this.goalInputModel();
    if (!val.trim()) return false;
    const raw = parseFloat(val);
    if (isNaN(raw) || raw <= 0 || raw < MIN_GOAL_KG) return true;
    const current = this.store.currentMetric()?.weightKg;
    return current !== undefined && raw >= current;
  });

  protected formattedProjectedDate = computed(() => {
    const date = this.store.currentMetric()?.projectedAchievementDate;
    if (!date) return this.translate.instant('body_progress.not_set');
    const lang = this.translate.currentLang ?? 'en';
    return new Date(date).toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US', {
      month: 'long', day: 'numeric', year: 'numeric',
    });
  });

  protected bmiBadgeLabel = computed(() => {
    if (this.bmiOutdated()) return this.translate.instant('body_progress.bmi_outdated');
    const cat = this.store.currentMetric()?.bmiCategory();
    if (!cat) return '';
    switch (cat) {
      case BmiCategory.NORMAL:      return this.translate.instant('body_progress.bmi_normal');
      case BmiCategory.UNDERWEIGHT: return this.translate.instant('body_progress.bmi_category_underweight');
      case BmiCategory.OVERWEIGHT:  return this.translate.instant('body_progress.bmi_category_overweight');
      case BmiCategory.OBESE:       return this.translate.instant('body_progress.bmi_category_obese');
      default:                      return cat;
    }
  });

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

  protected bmiOutdated = computed(() => this.store.isStale());

  protected bmiCategoryLabel = computed(() => {
    if (this.bmiOutdated()) return this.translate.instant('body_progress.bmi_may_inaccurate');
    const cat = this.store.currentMetric()?.bmiCategory();
    if (!cat) return '';
    switch (cat) {
      case BmiCategory.UNDERWEIGHT: return this.translate.instant('body_progress.bmi_category_underweight');
      case BmiCategory.NORMAL:      return this.translate.instant('body_progress.bmi_category_normal');
      case BmiCategory.OVERWEIGHT:  return this.translate.instant('body_progress.bmi_category_overweight');
      case BmiCategory.OBESE:       return this.translate.instant('body_progress.bmi_category_obese');
      default:                      return cat;
    }
  });

  protected formattedUpdatedLabel = computed(() => {
    const metric = this.store.currentMetric();
    if (!metric) return '';
    const days = metric.daysSinceLogged();
    if (days === 0) return this.translate.instant('body_progress.updated_today');
    if (days === 1) return this.translate.instant('body_progress.updated_yesterday');
    const lang   = this.translate.currentLang ?? 'en';
    const locale = lang === 'es' ? 'es-ES' : 'en-US';
    const date   = new Date(metric.loggedAt).toLocaleDateString(locale, { month: 'short', day: 'numeric' });
    return this.translate.instant('body_progress.updated_outdated', { date });
  });

  protected weightPlaceholder = computed(() => {
    const val = this.store.currentMetric()?.weightKg;
    return this.translate.instant('body_progress.placeholder_eg', { value: val?.toFixed(1) ?? '70.0' });
  });

  /** Chart X-axis date labels formatted in the current UI language. */
  protected formattedChartDates = computed(() => {
    const lang   = this.translate.currentLang ?? 'en';
    const locale = lang === 'es' ? 'es-ES' : 'en-US';
    return this.store.chartPoints().dates.map(iso =>
      new Date(iso).toLocaleDateString(locale, { month: 'short', day: 'numeric' }),
    );
  });

  async ngOnInit(): Promise<void> {
    await this.store.initialise();
    const metric = this.store.currentMetric();
    const user   = this.iamStore.currentUser();
    if (metric && user && !this.store.isMuscleGain() && !(metric.targetWeightKg > 0)) {
      await this.store.applyInitialTarget(user.goal);
      if ((this.store.currentMetric()?.targetWeightKg ?? 0) > 0) {
        this.showGoalAutoSetModal.set(true);
      }
    }
  }

  // ─── Global keyboard handler ──────────────────────────────────────────────

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.showLogModal())         this.onCloseLogModal();
    if (this.isEditingGoal())        this.onCancelGoalInline();
    if (this.showCompositionModal()) this.onCloseCompositionModal();
  }

  // ─── Date range toggle ────────────────────────────────────────────────────

  onDaysChange(event: MatButtonToggleChange): void {
    const days = event.value as 7 | 30 | 90;
    this.store.loadHistory(days);
  }

  // ─── Log weight modal ─────────────────────────────────────────────────────

  onOpenLogModal(): void {
    this.weightInput.set('');
    this.weightError.set('');
    this.showLogModal.set(true);
  }

  onCloseLogModal(): void {
    this.showLogModal.set(false);
    this.weightInput.set('');
    this.weightError.set('');
  }

  async onSaveWeight(): Promise<void> {
    const val = parseFloat(this.weightInput());
    if (!this.weightInput().trim() || isNaN(val) || val <= 0) {
      this.weightError.set(this.translate.instant('body_progress.error_weight_positive'));
      return;
    }
    if (val > WEIGHT_MAX_KG) {
      this.weightError.set(this.translate.instant('body_progress.error_weight_max'));
      return;
    }
    this.weightError.set('');
    await this.store.logWeight(val);
    this.weightInput.set('');
    this.showLogModal.set(false);
  }

  onCancelWeight(): void {
    this.weightInput.set('');
    this.weightError.set('');
  }

  onWeightInputChange(event: Event): void {
    this.weightInput.set((event.target as HTMLInputElement).value);
    this.weightError.set('');
  }

  // ─── Inline goal weight edit ──────────────────────────────────────────────

  onConfirmAutoGoal(): void {
    this.showGoalAutoSetModal.set(false);
  }

  onAdjustAutoGoal(): void {
    this.showGoalAutoSetModal.set(false);
    this.onStartEditGoal();
  }

  onStartEditGoal(): void {
    const target = this.store.currentMetric()?.targetWeightKg;
    this.goalInputModel.set(target && target > 0 ? target.toString() : '');
    this.goalInputError.set('');
    this.isEditingGoal.set(true);
  }

  onCancelGoalInline(): void {
    this.isEditingGoal.set(false);
    this.goalInputModel.set('');
    this.goalInputError.set('');
  }

  async onSaveGoalInline(): Promise<void> {
    const raw   = parseFloat(this.goalInputModel());
    const error = this.validateGoalWeight(raw);
    if (!this.goalInputModel().trim() || error) {
      this.goalInputError.set(error || this.translate.instant('body_progress.error_weight_invalid'));
      return;
    }
    this.goalInputError.set('');
    await this.store.setTargetWeight(raw);
    this.isEditingGoal.set(false);
    this.goalInputModel.set('');
  }

  onGoalModelChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.goalInputModel.set(value);
    this.goalInputError.set(value.trim() ? this.validateGoalWeight(parseFloat(value)) : '');
  }

  private validateGoalWeight(raw: number): string {
    if (isNaN(raw) || raw <= 0) {
      return this.translate.instant('body_progress.error_weight_invalid');
    }
    if (raw < MIN_GOAL_KG) {
      return this.translate.instant('body_progress.error_goal_below_min', { min: MIN_GOAL_KG });
    }
    const current = this.store.currentMetric()?.weightKg;
    if (current !== undefined && raw >= current) {
      return this.translate.instant('body_progress.error_goal_below_current', { current: current.toFixed(1) });
    }
    return '';
  }

  // ─── Composition update modal ─────────────────────────────────────────────

  onOpenCompositionModal(): void {
    this.compositionMode.set('A');
    this.compositionWaistCm.set('');
    this.compositionPantSize.set(null);
    this.compositionVisualLevel.set(null);
    this.showCompositionModal.set(true);
  }

  onCloseCompositionModal(): void {
    this.showCompositionModal.set(false);
    this.compositionMode.set('A');
    this.compositionWaistCm.set('');
    this.compositionPantSize.set(null);
    this.compositionVisualLevel.set(null);
  }

  selectCompositionMode(mode: 'A' | 'B' | 'C'): void {
    this.compositionMode.set(mode);
  }

  onCompositionWaistInput(event: Event): void {
    this.compositionWaistCm.set((event.target as HTMLInputElement).value);
  }

  selectCompositionPantSize(size: number): void {
    this.compositionPantSize.set(size);
  }

  selectCompositionVisualLevel(index: number): void {
    this.compositionVisualLevel.set(index);
  }

  async onSaveComposition(): Promise<void> {
    const { waistCm, override } = this.getCompositionArgs();
    await this.store.setComposition(waistCm, override);
    this.showCompositionModal.set(false);
  }

  private getCompositionArgs(): { waistCm: number | undefined; override: number | undefined } {
    const mode = this.compositionMode();
    if (mode === 'A') return { waistCm: parseFloat(this.compositionWaistCm()), override: undefined };
    if (mode === 'B') {
      const entry = this.pantSizes.find(s => s.size === this.compositionPantSize());
      return { waistCm: entry?.waistCm, override: undefined };
    }
    const idx   = this.compositionVisualLevel();
    const level = idx !== null ? this.visualLevels[idx] : undefined;
    return { waistCm: undefined, override: level?.override };
  }

  // ─── Tooltips ─────────────────────────────────────────────────────────────

  toggleTooltip(card: 'bmi' | 'bmr' | 'tdee' | 'body_fat' | 'lean_mass' | 'lean_bulk'): void {
    this.activeTooltip.update(current => (current === card ? null : card));
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

  // ─── History entry edit / delete ─────────────────────────────────────────

  isWithin7Days(isoDate: string): boolean {
    const diffDays = Math.floor((Date.now() - new Date(isoDate).getTime()) / 86_400_000);
    return diffDays < 7;
  }

  onStartEditMetric(metric: BodyMetric): void {
    this.editingMetricId.set(metric.id);
    this.editWeightInput.set(metric.weightKg.toString());
    this.editWeightError.set('');
  }

  onEditWeightInput(event: Event): void {
    this.editWeightInput.set((event.target as HTMLInputElement).value);
    this.editWeightError.set('');
  }

  onCancelEditMetric(): void {
    this.editingMetricId.set(null);
    this.editWeightInput.set('');
    this.editWeightError.set('');
  }

  async onSaveEditMetric(metric: BodyMetric): Promise<void> {
    const raw = parseFloat(this.editWeightInput());
    if (isNaN(raw) || raw <= 0 || raw > WEIGHT_MAX_KG) {
      this.editWeightError.set(this.translate.instant('body_progress.error_weight_invalid'));
      return;
    }
    this.editWeightError.set('');
    await this.store.updateWeight(metric, raw);
    this.editingMetricId.set(null);
    this.editWeightInput.set('');
  }

  async onDeleteMetric(metricId: number | string): Promise<void> {
    await this.store.deleteWeight(metricId);
  }
}
