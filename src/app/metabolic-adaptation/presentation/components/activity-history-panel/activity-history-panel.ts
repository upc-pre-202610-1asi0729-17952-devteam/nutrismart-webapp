import { Component, input, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { ActivityLog } from '../../../domain/model/activity-log.entity';

/**
 * Dumb panel that renders a list of activity logs.
 *
 * In summary mode (`showAll = false`) it shows a "See all" button.
 * In full mode it exposes pagination controls via `pageChange` output.
 */
@Component({
  selector: 'app-activity-history-panel',
  imports: [TranslatePipe, DatePipe],
  templateUrl: './activity-history-panel.html',
  styleUrl: './activity-history-panel.css',
})
export class ActivityHistoryPanel {
  /** Logs to display for the current view/page. */
  readonly logs        = input<ActivityLog[]>([]);
  /** Whether the full paginated view is active. */
  readonly showAll     = input<boolean>(false);
  /** Current page number (1-based). */
  readonly currentPage = input<number>(1);
  /** Total number of pages for full view. */
  readonly totalPages  = input<number>(1);

  /** Emitted when the user clicks "See all". */
  readonly viewAll    = output<void>();
  /** Emitted when the user navigates to a different page. */
  readonly pageChange = output<number>();

  onViewAll(): void {
    this.viewAll.emit();
  }

  onPrev(): void {
    if (this.currentPage() > 1) this.pageChange.emit(this.currentPage() - 1);
  }

  onNext(): void {
    if (this.currentPage() < this.totalPages()) this.pageChange.emit(this.currentPage() + 1);
  }
}
