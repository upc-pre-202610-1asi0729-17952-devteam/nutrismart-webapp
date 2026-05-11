import { Component, computed, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { MetabolicStore } from '../../../application/metabolic.store';
import { BodyMetric } from '../../../domain/model/body-metric.entity';

@Component({
  selector: 'app-weight-history',
  imports: [RouterLink, DecimalPipe, TranslatePipe],
  templateUrl: './weight-history.html',
  styleUrl: './weight-history.css',
})
export class WeightHistoryView implements OnInit {
  protected store = inject(MetabolicStore);

  protected rows = computed(() => {
    const all = this.store.allHistory();
    return all.map((metric, i) => ({
      metric,
      delta: i < all.length - 1
        ? Math.round((metric.weightKg - all[i + 1].weightKg) * 10) / 10
        : null,
    }));
  });

  async ngOnInit(): Promise<void> {
    await this.store.loadAllHistory();
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
