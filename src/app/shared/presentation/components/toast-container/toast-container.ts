import { Component, inject } from '@angular/core';
import { NotificationService } from '../../../application/notification.service';
import { ToastItem } from '../toast-item/toast-item';

/**
 * Smart container component that renders the active in-app toast queue.
 *
 * Mounted once at the root level in {@link App} so notifications are visible
 * on all authenticated and public screens. Renders one {@link ToastItem} per
 * entry in {@link NotificationService.notifications}.
 */
@Component({
  selector: 'app-toast-container',
  imports: [ToastItem],
  templateUrl: './toast-container.html',
  styleUrl: './toast-container.css',
})
export class ToastContainer {
  protected readonly notificationService = inject(NotificationService);
}
