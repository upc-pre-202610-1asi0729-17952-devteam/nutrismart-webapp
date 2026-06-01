import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { filter } from 'rxjs/operators';
import { IamStore } from '../../../../iam/application/iam.store';

/**
 * Represents a single navigation item in the sidebar.
 */
interface NavItem {
  /** Absolute router path (e.g. `'/dashboard'`). */
  link: string;
  /** ngx-translate key used to render the label (e.g. `'nav.dashboard'`). */
  label: string;
  /** Unicode symbol displayed as the nav icon. */
  icon: string;
}

/**
 * Main application shell component.
 *
 * Renders the fixed sidebar navigation and the `<router-outlet>` where
 * bounded-context views are projected. The sidebar has a single section with
 * six main items driven by a signal-based array so items can be updated
 * reactively if needed. Subscription management is accessible from the
 * profile footer area.
 *
 * On mobile/tablet (≤ 1023px) the sidebar is hidden by default and toggled
 * via a hamburger button. Navigation events automatically close it.
 */
@Component({
  selector: 'app-layout',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    TranslatePipe,
  ],
  templateUrl: './layout.html',
  styleUrl: './layout.css',
})
export class Layout {
  /** IAM store providing the current user for the sidebar footer. */
  iamStore = inject(IamStore);

  /** Controls sidebar visibility on mobile/tablet. */
  isSidebarOpen = signal(false);

  constructor() {
    inject(Router).events
      .pipe(
        filter(e => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.isSidebarOpen.set(false));
  }

  /** @param event – click event used to stop propagation from the sidebar itself. */
  toggleSidebar(event?: Event): void {
    event?.stopPropagation();
    this.isSidebarOpen.update(open => !open);
  }

  closeSidebar(): void {
    this.isSidebarOpen.set(false);
  }

  /** All navigation items shown in a single sidebar section. */
  mainNav = signal<NavItem[]>([
    { link: '/dashboard',        label: 'nav.dashboard',        icon: '⊞' },
    { link: '/nutrition-log',    label: 'nav.nutrition_log',    icon: '✓' },
    { link: '/recommendations',  label: 'nav.recommendations',  icon: '◎' },
    { link: '/body-progress',    label: 'nav.body_progress',    icon: '〜' },
    { link: '/wearable',         label: 'nav.wearable',         icon: '▣' },
    { link: '/analytics',        label: 'nav.analytics',        icon: '↑' },
  ]);
}
