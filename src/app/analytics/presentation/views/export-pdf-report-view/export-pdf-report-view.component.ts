import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AnalyticsStore } from '../../../application/analytics.store';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { ReplacePipe } from '../../../../shared/pipes/replace.pipe'; // Import the custom pipe

@Component({
  selector: 'app-export-pdf-report-view',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDatepickerModule,
    MatInputModule,
    MatNativeDateModule,
    ReplacePipe, // Add the custom pipe to imports
  ],
  templateUrl: './export-pdf-report-view.component.html',
  styleUrl: './export-pdf-report-view.component.css',
})
export class ExportPdfReportViewComponent {
  protected readonly analyticsStore = inject(AnalyticsStore);

  @Input() isVisible: boolean = false;
  @Output() close = new EventEmitter<void>();
  @Output() reportGenerated = new EventEmitter<void>();

  fromDate: Date | null = null;
  toDate: Date | null = null;

  reportOptions = [
    { label: 'Daily calorie summaries', selected: true },
    { label: 'Macro averages', selected: true },
    { label: 'Weight evolution chart', selected: true },
    { label: 'Adherence history (drop/recovery events)', selected: true },
    { label: 'Activity data', selected: true },
  ];

  get isGenerateButtonDisabled(): boolean {
    return !this.fromDate || !this.toDate || this.analyticsStore.loading();
  }

  onGeneratePdf(): void {
    if (this.fromDate && this.toDate) {
      const fromIso = this.fromDate.toISOString().split('T')[0];
      const toIso = this.toDate.toISOString().split('T')[0];

      this.analyticsStore.exportReport(fromIso, toIso).subscribe({
        next: () => {
          this.reportGenerated.emit();
          this.close.emit();
        },
        error: (err) => {
          console.error('Error generating PDF:', err);
          // Handle error, e.g., show a toast message
        },
      });
    }
  }

  onCancel(): void {
    this.close.emit();
  }
}
