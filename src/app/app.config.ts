import { APP_INITIALIZER, ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withRouterConfig } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { firstValueFrom } from 'rxjs';

import { routes } from './app.routes';
import { AnalyticsApi } from './analytics/infrastructure/analytics-api';
import { AnalyticsApiHttpService } from './analytics/infrastructure/analytics-api-http.service';

function initLanguage(translate: TranslateService) {
  return async () => {
    const saved = localStorage.getItem('lang') ?? 'en';
    translate.setDefaultLang('en');
    await firstValueFrom(translate.use(saved));
    const other = saved === 'es' ? 'en' : 'es';
    const otherTranslations = await firstValueFrom(translate.currentLoader.getTranslation(other));
    translate.setTranslation(other, otherTranslations);
  };
}

/**
 * Global application configuration.
 *
 * Registers the following providers:
 * - `provideRouter` — client-side routing with the application route tree.
 * - `provideHttpClient` — Angular's HTTP client (required by TranslateHttpLoader).
 * - `provideTranslateService` — ngx-translate (language bootstrapped via APP_INITIALIZER).
 * - `provideTranslateHttpLoader` — loads translation files from `/i18n/<lang>.json`.
 * - `AnalyticsApi` — Provides the mock implementation for AnalyticsApi.
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withRouterConfig({ onSameUrlNavigation: 'reload' })),
    provideHttpClient(),
    provideTranslateService(),
    provideTranslateHttpLoader({ prefix: '/i18n/', suffix: '.json' }),
    { provide: AnalyticsApi, useClass: AnalyticsApiHttpService },
    {
      provide: APP_INITIALIZER,
      useFactory: initLanguage,
      deps: [TranslateService],
      multi: true,
    },
  ],
};
