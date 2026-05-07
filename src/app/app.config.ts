import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';

import { routes } from './app.routes';

/**
 * Global application configuration.
 *
 * Registers the following providers:
 * - `provideRouter` — client-side routing with the application route tree.
 * - `provideHttpClient` — Angular's HTTP client (required by TranslateHttpLoader).
 * - `provideTranslateService` — ngx-translate with English as the default language.
 * - `provideTranslateHttpLoader` — loads translation files from `/i18n/<lang>.json`.
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(),
    provideTranslateService({ defaultLanguage: 'en' }),
    provideTranslateHttpLoader({ prefix: '/i18n/', suffix: '.json' }),
  ]
};
