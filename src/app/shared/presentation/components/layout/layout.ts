import { Component, HostListener, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { filter } from 'rxjs/operators';
import { IamStore } from '../../../../iam/application/iam.store';
import { LanguageSwitcher } from '../language-switcher/language-switcher';

/**
 * Represents a single navigation item in the sidebar.
 */
interface NavItem {
  /** Absolute router path (e.g. `'/dashboard'`). */
  link: string;
  /** ngx-translate key used to render the label (e.g. `'nav.dashboard'`). */
  label: string;
  /** ngx-translate key for the short description shown below the label. */
  description: string;
  /** Unicode symbol displayed as the nav icon. */
  icon: string;
}

/**
 * Main application shell component.
 *
 * Renders the fixed sidebar navigation and the `<router-outlet>` where
 * bounded-context views are projected. The sidebar is divided into two
 * sections — MAIN and TOOLS — each item showing a label and a short
 * description. Subscription management is accessible from the profile footer.
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
    LanguageSwitcher,
  ],
  templateUrl: './layout.html',
  styleUrl: './layout.css',
})
export class Layout {
  /** IAM store providing the current user for the sidebar footer. */
  iamStore = inject(IamStore);

  /** Controls sidebar visibility on mobile/tablet. */
  isSidebarOpen = signal(false);

  /** Controls user dropdown visibility. */
  isUserMenuOpen = signal(false);

  constructor() {
    inject(Router).events
      .pipe(
        filter(e => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        this.isSidebarOpen.set(false);
        this.isUserMenuOpen.set(false);
      });
  }

  /** @param event – click event used to stop propagation from the sidebar itself. */
  toggleSidebar(event?: Event): void {
    event?.stopPropagation();
    this.isSidebarOpen.update(open => !open);
  }

  closeSidebar(): void {
    this.isSidebarOpen.set(false);
  }

  toggleUserMenu(event: Event): void {
    event.stopPropagation();
    this.isUserMenuOpen.update(open => !open);
  }

  @HostListener('document:click')
  closeUserMenu(): void {
    this.isUserMenuOpen.set(false);
  }

  /** Primary navigation items shown in the MAIN section. */
  principalNav = signal<NavItem[]>([
    { link: '/dashboard',       label: 'nav.dashboard',       description: 'nav.dashboard_desc',       icon: '⊞' },
    { link: '/nutrition-log',   label: 'nav.nutrition_log',   description: 'nav.nutrition_log_desc',   icon: '✓' },
    { link: '/recommendations', label: 'nav.recommendations', description: 'nav.recommendations_desc', icon: '◎' },
  ]);

  /** Secondary navigation items shown in the TOOLS section. */
  toolsNav = signal<NavItem[]>([
    { link: '/body-progress', label: 'nav.body_progress', description: 'nav.body_progress_desc', icon: '〜' },
    { link: '/wearable',      label: 'nav.wearable',      description: 'nav.wearable_desc',      icon: '▣' },
    { link: '/analytics',     label: 'nav.analytics',     description: 'nav.analytics_desc',     icon: '↑' },
  ]);
}
