import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DecimalPipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonToggleGroup, MatButtonToggle } from '@angular/material/button-toggle';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { MetabolicStore } from '../../../application/metabolic.store';
import { IamStore } from '../../../../iam/application/iam.store';
import { BodyMetric, BmiCategory } from '../../../domain/model/body-metric.entity';

/**
 * Main Body Progress view — route `/body-progress/progress`.
 *
 * Single responsibility: execute UpdateBodyMetrics and display the resulting
 * read models (Weight History Chart, BMI Result, Updated Caloric Target View).
 *
 * Height and goal-weight editing belong in Profile Settings.
 *
 * @author Espinoza Cruz, Angela Milagros
 */
@Component({
  selector: 'app-body-progress',
  imports: [DecimalPipe, NgClass, FormsModule, RouterLink, MatButtonToggleGroup, MatButtonToggle, TranslatePipe],
  templateUrl: './body-progress.html',
  styleUrl: './body-progress.css',
})
export class BodyProgressView implements OnInit {
  protected store    = inject(MetabolicStore);
  protected iamStore = inject(IamStore);
  private translate  = inject(TranslateService);

  // ─── Log weight form ──────────────────────────────────────────────────────

  protected weightInput = signal<string>('');
  protected weightError = signal<string>('');

  // ─── Body composition inputs ──────────────────────────────────────────────

  /**
   * Plain properties bound via [(ngModel)]: number inputs with [value]+signal
   * cause Angular to reset the DOM value mid-keystroke, making the field unresponsive.
   */
  protected waistInputModel = '';
  protected neckInputModel  = '';

  // ─── Tooltip state ────────────────────────────────────────────────────────

  protected activeTooltip = signal<'bmi' | 'bmr' | 'tdee' | 'body_fat' | 'lean_mass' | null>(null);

  // ─── Computed ─────────────────────────────────────────────────────────────

  protected isWeightTyping = computed(() => this.weightInput().trim().length > 0);

  /**
   * Live BMI/TDEE preview — delegates to BodyMetric entity methods to avoid
   * duplicating the Mifflin-St Jeor formula.
   */
  protected weightPreview = computed<{ bmi: number; tdee: number } | null>(() => {
    const raw      = parseFloat(this.weightInput());
    if (!raw || raw <= 0 || raw > 500) return null;
    const heightCm = this.store.currentMetric()?.heightCm;
    if (!heightCm) return null;
    const temp = new BodyMetric({ id: 0, userId: 0, weightKg: raw, heightCm, loggedAt: new Date().toISOString() });
    return { bmi: temp.bmi(), tdee: temp.tdee() };
  });

  protected weightInputInvalid = computed(() => {
    const raw = parseFloat(this.weightInput());
    return this.weightInput().trim().length > 0 && (isNaN(raw) || raw <= 0 || raw > 500);
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
    return cat === BmiCategory.NORMAL
      ? this.translate.instant('body_progress.bmi_normal')
      : cat;
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
  }

  // ─── Date range toggle ────────────────────────────────────────────────────

  async selectDays(days: 7 | 30 | 90): Promise<void> {
    await this.store.loadHistory(days);
  }

  // ─── Log weight ───────────────────────────────────────────────────────────

  onOpenLogWeight(): void {
    this.weightInput.set('');
    this.weightError.set('');
  }

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

  onCancelWeight(): void {
    this.weightInput.set('');
    this.weightError.set('');
  }

  onWeightInputChange(value: string): void {
    this.weightInput.set(value);
    this.weightError.set('');
  }

  // ─── Body composition ─────────────────────────────────────────────────────

  async onCalculateComposition(): Promise<void> {
    const waist = parseFloat(this.waistInputModel);
    const neck  = parseFloat(this.neckInputModel);
    if (!waist || !neck || waist <= 0 || neck <= 0) return;
    await this.store.updateBodyComposition(waist, neck);
    this.waistInputModel = '';
    this.neckInputModel  = '';
  }

  // ─── Tooltips ─────────────────────────────────────────────────────────────

  toggleTooltip(card: 'bmi' | 'bmr' | 'tdee' | 'body_fat' | 'lean_mass'): void {
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
}
