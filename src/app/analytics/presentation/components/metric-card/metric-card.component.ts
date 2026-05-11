import { Component, Input } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';

export interface MetricCardVm {
  label: string;
  value: string;
  description: string;
  statusClass: string;
}

@Component({
  selector: 'app-metric-card',
  standalone: true,
  imports: [CommonModule, NgClass],
  templateUrl: './metric-card.component.html',
  styleUrl: './metric-card.component.css',
})
export class MetricCardComponent {
  @Input({ required: true }) vm!: MetricCardVm;
}
