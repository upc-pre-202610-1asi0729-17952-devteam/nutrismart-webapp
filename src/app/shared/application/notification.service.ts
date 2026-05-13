import { Injectable, signal } from '@angular/core';

/** Visual severity used to style and categorise in-app toast notifications. */
export type NotificationType = 'success' | 'warning' | 'danger' | 'celebration' | 'info';

/**
 * A single notification entry managed by {@link NotificationService}.
 */
export interface InAppNotification {
  /** Unique identifier used for deduplication and dismissal. */
  id: string;
  /** Visual severity variant. */
  type: NotificationType;
  /** ngx-translate key for the message body. */
  messageKey: string;
  /** Optional interpolation params forwarded to ngx-translate. */
  params?: Record<string, string | number>;
}

/**
 * Application-wide in-app notification service.
 *
 * Maintains a signal-based queue of {@link InAppNotification} entries rendered
 * by {@link ToastContainer}. Toasts auto-dismiss after {@link TOAST_DURATION_MS}
 * ms and can also be removed manually via {@link dismiss}.
 */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  /** Duration in milliseconds before a toast auto-dismisses. */
  static readonly TOAST_DURATION_MS = 4_000;

  private readonly _notifications = signal<InAppNotification[]>([]);

  /** Read-only signal consumed by {@link ToastContainer}. */
  readonly notifications = this._notifications.asReadonly();

  /**
   * Enqueues a new toast notification.
   *
   * @param type       - Visual severity / style variant.
   * @param messageKey - ngx-translate key for the message body.
   * @param params     - Optional interpolation parameters passed to the translate pipe.
   */
  notify(
    type: NotificationType,
    messageKey: string,
    params?: Record<string, string | number>,
  ): void {
    const notification: InAppNotification = {
      id: crypto.randomUUID(),
      type,
      messageKey,
      params,
    };
    this._notifications.update(list => [...list, notification]);
  }

  /**
   * Removes a notification from the queue by its identifier.
   *
   * @param id - The notification id to remove.
   */
  dismiss(id: string): void {
    this._notifications.update(list => list.filter(n => n.id !== id));
  }
}
