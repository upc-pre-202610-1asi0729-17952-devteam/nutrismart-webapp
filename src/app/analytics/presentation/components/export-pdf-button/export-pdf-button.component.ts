import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-export-pdf-button',
  standalone: true,
  imports: [TranslateModule, MatIconModule],
  templateUrl: './export-pdf-button.component.html',
  styleUrl: './export-pdf-button.component.css',
})
export class ExportPdfButtonComponent {
  @Input() isPremiumUser: boolean = false;
  @Input() isLoading: boolean = false;
  @Output() exportPdf = new EventEmitter<void>();

  constructor(private readonly translate: TranslateService) {}

  get tooltipText(): string {
    return this.translate.instant(
      this.isPremiumUser
        ? 'analytics.export_btn_label'
        : 'analytics.export_btn_premium_required'
    );
  }

  onClick(): void {
    if (this.isPremiumUser && !this.isLoading) {
      this.exportPdf.emit();
    }
  }
}
