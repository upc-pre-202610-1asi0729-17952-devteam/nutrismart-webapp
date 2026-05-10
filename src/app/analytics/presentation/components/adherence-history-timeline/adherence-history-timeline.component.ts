import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { AdherenceHistoryEntry } from '../../../domain/model/analytics-models';

@Component({
  selector: 'app-adherence-history-timeline',
  standalone: true,
  imports: [CommonModule, NgClass],
  templateUrl: './adherence-history-timeline.component.html',
  styleUrl: './adherence-history-timeline.component.css',
})
export class AdherenceHistoryTimelineComponent implements OnChanges {
  @Input({ required: true }) adherenceHistory: AdherenceHistoryEntry[] = [];

  timelineEntries: { date: string; statusClass: string; tooltip: string }[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['adherenceHistory']) {
      this.processTimelineData();
    }
  }

  private processTimelineData(): void {
    this.timelineEntries = this.adherenceHistory.map(entry => {
      let statusClass = '';
      let tooltip = `Adherence: ${entry.status}`;

      switch (entry.status) {
        case 'ON_TRACK':
          statusClass = 'status-on-track';
          break;
        case 'AT_RISK':
          statusClass = 'status-at-risk';
          break;
        case 'DROPPED':
          statusClass = 'status-dropped';
          break;
        case 'RECOVERED':
          statusClass = 'status-recovered';
          break;
        default:
          statusClass = 'status-unknown';
          break;
      }

      return {
        date: this.formatDate(entry.date),
        statusClass: statusClass,
        tooltip: tooltip,
      };
    });
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}
