import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon'; // Assuming Material Icons for the PDF icon

@Component({
  selector: 'app-export-pdf-button',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './export-pdf-button.component.html',
  styleUrl: './export-pdf-button.component.css',
})
export class ExportPdfButtonComponent {
  @Input() isPremiumUser: boolean = false; // To enable/disable the button
  @Input() isLoading: boolean = false; // To show loading state
  @Output() exportPdf = new EventEmitter<void>();

  get tooltipText(): string {
    return this.isPremiumUser ? 'Export analytics report to PDF' : 'Requires Premium plan';
  }

  onClick(): void {
    if (this.isPremiumUser && !this.isLoading) {
      this.exportPdf.emit();
    }
  }
}
