import { Component, computed, inject, Input } from '@angular/core';
import { DecimalPipe, NgClass } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { AnalyticsPeriod, MacroAnalysis } from '../../../domain/model/analytics-models';

@Component({
  selector: 'app-average-macros-panel',
  standalone: true,
  imports: [DecimalPipe, NgClass, TranslateModule],
  templateUrl: './average-macros-panel.component.html',
  styleUrl: './average-macros-panel.component.css',
})
export class AverageMacrosPanelComponent {
  @Input({ required: true }) macroAnalysis: MacroAnalysis[] = [];
  @Input({ required: true }) daysWithCompleteLog: boolean[] = [];
  @Input() proteinCompliance: string | undefined;
  @Input() period: AnalyticsPeriod = '7_DAYS';

  private readonly translate = inject(TranslateService);

  private readonly activeLang = toSignal(
    this.translate.onLangChange.pipe(map(e => e.lang)),
    { initialValue: this.translate.currentLang ?? 'en' },
  );

  readonly weekLabels = computed(() =>
    this.activeLang() === 'es'
      ? ['L', 'M', 'X', 'J', 'V', 'S', 'D']
      : ['M', 'T', 'W', 'T', 'F', 'S', 'S']
  );

  get completeDaysCount(): number {
    return this.daysWithCompleteLog.filter(d => d).length;
  }

  get completeDaysTotal(): number {
    return this.daysWithCompleteLog.length;
  }

  get completeDaysPercent(): number {
    const total = this.completeDaysTotal;
    return total === 0 ? 0 : Math.round((this.completeDaysCount / total) * 100);
  }

  macroPercent(consumed: number, target: number): number {
    if (target === 0) return 0;
    return Math.min(Math.round((consumed / target) * 100), 100);
  }
}
