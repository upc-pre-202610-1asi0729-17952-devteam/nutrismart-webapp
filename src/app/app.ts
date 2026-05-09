import { Component, inject } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Layout } from './shared/presentation/components/layout/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';

/** Route prefixes that should render without the sidebar layout. */
const PUBLIC_PREFIXES = ['/auth', '/onboarding', '/subscription'];

/**
 * Root component of the NutriSmart application.
 *
 * Bootstraps ngx-translate with the supported languages and sets English as
 * the default. Conditionally renders either the full sidebar {@link Layout} or
 * a plain `<router-outlet>` depending on whether the current route is a public
 * (unauthenticated) route such as `/auth/**` or `/onboarding/**`.
 */
@Component({
  selector: 'app-root',
  imports: [Layout, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  /** ngx-translate service used to configure supported languages. */
  private translate = inject(TranslateService);

  /** Angular router used to watch navigation events. */
  private router = inject(Router);

  /**
   * Signal that emits `true` when the current URL starts with a public route
   * prefix (`/auth` or `/onboarding`), causing the sidebar layout to be hidden.
   */
  isPublicRoute = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map(() => PUBLIC_PREFIXES.some((p) => this.router.url.startsWith(p))),
      startWith(PUBLIC_PREFIXES.some((p) => this.router.url.startsWith(p))),
    ),
    { initialValue: false },
  );

  constructor() {
    this.translate.addLangs(['en', 'es']);
    const saved = localStorage.getItem('lang');
    this.translate.use(saved === 'es' ? 'es' : 'en');
  }
}
