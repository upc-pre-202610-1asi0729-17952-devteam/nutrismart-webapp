import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { TranslateModule } from '@ngx-translate/core';

export interface ExportPdfRequest {
  fromDate: string;
  toDate: string;
  includeDaily: boolean;
  includeMacros: boolean;
  includeWeight: boolean;
  includeAdherence: boolean;
  includeActivity: boolean;
}

@Component({
  selector: 'app-export-pdf-report-view',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDatepickerModule,
    MatInputModule,
    MatNativeDateModule,
    TranslateModule,
  ],
  templateUrl: './export-pdf-report-view.component.html',
  styleUrl: './export-pdf-report-view.component.css',
})
export class ExportPdfReportViewComponent {
  @Input() isVisible: boolean = false;
  @Input() isLoading: boolean = false;
  @Input() errorKey: string | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() exportRequest = new EventEmitter<ExportPdfRequest>();

  fromDate: Date | null = null;
  toDate: Date | null = null;

  readonly reportOptions = [
    { labelKey: 'analytics.export_option_daily',     key: 'includeDaily',     selected: true },
    { labelKey: 'analytics.export_option_macros',    key: 'includeMacros',    selected: true },
    { labelKey: 'analytics.export_option_weight',    key: 'includeWeight',    selected: true },
    { labelKey: 'analytics.export_option_adherence', key: 'includeAdherence', selected: true },
    { labelKey: 'analytics.export_option_activity',  key: 'includeActivity',  selected: true },
  ];

  get isGenerateButtonDisabled(): boolean {
    return !this.fromDate || !this.toDate || this.isLoading;
  }

  onGeneratePdf(): void {
    if (!this.fromDate || !this.toDate) return;
    const opts = Object.fromEntries(this.reportOptions.map(o => [o.key, o.selected])) as Record<string, boolean>;
    this.exportRequest.emit({
      fromDate:        this.fromDate.toISOString().split('T')[0],
      toDate:          this.toDate.toISOString().split('T')[0],
      includeDaily:     opts['includeDaily'],
      includeMacros:    opts['includeMacros'],
      includeWeight:    opts['includeWeight'],
      includeAdherence: opts['includeAdherence'],
      includeActivity:  opts['includeActivity'],
    });
  }

  onCancel(): void {
    this.close.emit();
  }
}
