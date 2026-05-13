import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { NgClass } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AdherenceHistoryEntry } from '../../../domain/model/analytics-models';

@Component({
  selector: 'app-adherence-history-timeline',
  standalone: true,
  imports: [NgClass, TranslateModule],
  templateUrl: './adherence-history-timeline.component.html',
  styleUrl: './adherence-history-timeline.component.css',
})
export class AdherenceHistoryTimelineComponent implements OnChanges {
  @Input({ required: true }) adherenceHistory: AdherenceHistoryEntry[] = [];

  timelineEntries: { date: string; statusClass: string; tooltip: string }[] = [];

  private readonly statusClassMap: Record<string, string> = {
    ON_TRACK:  'status-on-track',
    AT_RISK:   'status-at-risk',
    DROPPED:   'status-dropped',
    RECOVERED: 'status-recovered',
  };

  private readonly statusI18nMap: Record<string, string> = {
    ON_TRACK:  'analytics.status_on_track',
    AT_RISK:   'analytics.status_at_risk',
    DROPPED:   'analytics.status_dropped',
    RECOVERED: 'analytics.status_recovered',
  };

  constructor(private readonly translate: TranslateService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['adherenceHistory']) this.processTimelineData();
  }

  private processTimelineData(): void {
    this.timelineEntries = this.adherenceHistory.map(entry => ({
      date: this.formatDate(entry.date),
      statusClass: this.statusClassMap[entry.status] ?? 'status-unknown',
      tooltip: `${this.formatDate(entry.date)}: ${this.translate.instant(this.statusI18nMap[entry.status] ?? entry.status)}`,
    }));
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}
