import { Component, DestroyRef, inject, input, OnInit } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import {
  InAppNotification,
  NotificationService,
  NotificationType,
} from '../../../application/notification.service';

/**
 * Dumb presentational component for a single in-app toast notification.
 *
 * Renders the translated message, a type icon, and a dismiss button.
 * Auto-dismisses after {@link NotificationService.TOAST_DURATION_MS} ms by
 * calling {@link NotificationService.dismiss} — no output event needed.
 */
@Component({
  selector: 'app-toast-item',
  imports: [TranslatePipe],
  templateUrl: './toast-item.html',
  styleUrl: './toast-item.css',
})
export class ToastItem implements OnInit {
  /** The notification data to display. */
  readonly notification = input.required<InAppNotification>();

  private readonly notificationService = inject(NotificationService);
  private readonly destroyRef          = inject(DestroyRef);

  /** Unicode icon map keyed by notification type. */
  protected readonly iconMap: Record<NotificationType, string> = {
    success:     '✓',
    warning:     '⚠',
    danger:      '✖',
    celebration: '🔥',
    info:        'ℹ',
  };

  ngOnInit(): void {
    const timer = setTimeout(
      () => this.notificationService.dismiss(this.notification().id),
      NotificationService.TOAST_DURATION_MS,
    );
    this.destroyRef.onDestroy(() => clearTimeout(timer));
  }

  /** Dismiss the toast immediately. */
  protected dismiss(): void {
    this.notificationService.dismiss(this.notification().id);
  }
}
