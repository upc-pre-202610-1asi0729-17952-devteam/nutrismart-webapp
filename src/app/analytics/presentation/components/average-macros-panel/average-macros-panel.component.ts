import { Component, Input } from '@angular/core';
import { NgClass } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { MacroAnalysis } from '../../../domain/model/analytics-models';

@Component({
  selector: 'app-average-macros-panel',
  standalone: true,
  imports: [NgClass, TranslateModule],
  templateUrl: './average-macros-panel.component.html',
  styleUrl: './average-macros-panel.component.css',
})
export class AverageMacrosPanelComponent {
  @Input({ required: true }) macroAnalysis: MacroAnalysis[] = [];
  @Input({ required: true }) daysWithCompleteLog: boolean[] = [];
  @Input() proteinCompliance: string | undefined;

  readonly weekLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  macroPercent(consumed: number, target: number): number {
    if (target === 0) return 0;
    return Math.min(Math.round((consumed / target) * 100), 100);
  }
}
