import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { MetabolicStore } from '../../../application/metabolic.store';
import { BodyMetric } from '../../../domain/model/body-metric.entity';

const WEIGHT_MAX_KG = 500;

@Component({
  selector: 'app-weight-history',
  imports: [RouterLink, DecimalPipe, NgClass, FormsModule, TranslatePipe],
  templateUrl: './weight-history.html',
  styleUrl: './weight-history.css',
})
export class WeightHistoryView implements OnInit {
  protected store    = inject(MetabolicStore);
  private translate  = inject(TranslateService);

  protected editingMetricId = signal<number | string | null>(null);
  protected editWeightInput = signal<string>('');
  protected editWeightError = signal<string>('');

  protected rows = computed(() => {
    const all = this.store.allHistory();
    return all.map((metric, i) => ({
      metric,
      delta: i < all.length - 1 ? metric.calculateDelta(all[i + 1]) : null,
    }));
  });

  async ngOnInit(): Promise<void> {
    await this.store.loadAllHistory();
  }

  protected isWithin7Days(isoDate: string): boolean {
    return Math.floor((Date.now() - new Date(isoDate).getTime()) / 86_400_000) < 7;
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

  protected formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString(undefined, {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  }

  protected formatDelta(delta: number | null): string {
    if (delta === null || delta === 0) return '—';
    const sign = delta > 0 ? '+' : '';
    return `${sign}${delta.toFixed(1)} kg`;
  }

  protected isDeltaPositive(delta: number | null): boolean {
    return delta !== null && delta > 0;
  }

  protected isDeltaNegative(delta: number | null): boolean {
    return delta !== null && delta < 0;
  }
}
