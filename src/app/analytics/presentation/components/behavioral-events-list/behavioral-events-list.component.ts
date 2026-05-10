import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BehavioralEvent } from '../../../domain/model/analytics-models';

@Component({
  selector: 'app-behavioral-events-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './behavioral-events-list.component.html',
  styleUrl: './behavioral-events-list.component.css',
})
export class BehavioralEventsListComponent {
  @Input({ required: true }) behavioralEvents: BehavioralEvent[] = [];

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}
