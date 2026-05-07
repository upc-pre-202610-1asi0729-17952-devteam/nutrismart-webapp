import { Routes } from '@angular/router';
import { authGuard } from './iam/application/auth.guard';
import { onboardingGuard } from './iam/application/onboarding.guard';

/**
 * Lazy-loads the PageNotFound standalone component.
 * Used as the wildcard (`**`) catch-all route.
 */
const pageNotFound = () =>
  import('./shared/presentation/views/page-not-found/page-not-found').then(
    m => m.PageNotFound
  );

/** Lazy-loads the IAM (authentication) child routes. */
const iamRoutes = () =>
  import('./iam/presentation/iam.routes').then(m => m.iamRoutes);

/** Lazy-loads the onboarding child routes. */
const onboardingRoutes = () =>
  import('./iam/presentation/onboarding.routes').then(m => m.onboardingRoutes);

/** Lazy-loads the user profile child routes. */
const profileRoutes = () =>
  import('./iam/presentation/profile.routes').then(m => m.profileRoutes);

/** Lazy-loads the dashboard child routes (behavioral-consistency context). */
const dashboardRoutes = () =>
  import('./behavioral-consistency/presentation/dashboard.routes').then(
    m => m.dashboardRoutes
  );

/** Lazy-loads the nutrition tracking child routes. */
const nutritionRoutes = () =>
  import('./nutrition-tracking/presentation/nutrition.routes').then(
    m => m.nutritionRoutes
  );

/** Lazy-loads the smart scan child routes (restaurant-intelligence context). */
const smartScanRoutes = () =>
  import('./restaurant-intelligence/presentation/smart-scan.routes').then(
    m => m.smartScanRoutes
  );

/** Lazy-loads the recommendations child routes (smart-recommendation context). */
const recommendationsRoutes = () =>
  import(
    './smart-recommendation/recommendations/presentation/recommendations.routes'
  ).then(m => m.recommendationsRoutes);

/** Lazy-loads the body progress child routes (metabolic-adaptation context). */
const bodyProgressRoutes = () =>
  import('./metabolic-adaptation/presentation/body-progress.routes').then(
    m => m.bodyProgressRoutes
  );

/** Lazy-loads the pantry child routes (smart-recommendation context). */
const pantryRoutes = () =>
  import(
    './smart-recommendation/pantry/presentation/pantry.routes'
  ).then(m => m.pantryRoutes);

/** Lazy-loads the wearable child routes (metabolic-adaptation context). */
const wearableRoutes = () =>
  import('./metabolic-adaptation/presentation/wearable.routes').then(
    m => m.wearableRoutes
  );

/** Lazy-loads the analytics child routes. */
const analyticsRoutes = () =>
  import('./analytics/presentation/analytics.routes').then(
    m => m.analyticsRoutes
  );

/** Lazy-loads the subscriptions child routes. */
const subscriptionsRoutes = () =>
  import('./subscriptions/presentation/subscriptions.routes').then(
    m => m.subscriptionsRoutes
  );

const baseTitle = 'NutriSmart';

/**
 * Application route tree.
 *
 * All bounded-context routes are lazy-loaded so each team can work
 * independently without touching this file. The wildcard route renders
 * `PageNotFound` for any unregistered path.
 */
export const routes: Routes = [
  { path: 'auth',            loadChildren: iamRoutes },
  { path: 'onboarding',      loadChildren: onboardingRoutes,      canActivate: [onboardingGuard] },
  { path: 'profile',         loadChildren: profileRoutes,         canActivate: [authGuard] },
  { path: 'dashboard',       loadChildren: dashboardRoutes,       canActivate: [authGuard] },
  { path: 'nutrition',       loadChildren: nutritionRoutes,       canActivate: [authGuard] },
  { path: 'smart-scan',      loadChildren: smartScanRoutes,       canActivate: [authGuard] },
  { path: 'recommendations', loadChildren: recommendationsRoutes, canActivate: [authGuard] },
  { path: 'body-progress',   loadChildren: bodyProgressRoutes,    canActivate: [authGuard] },
  { path: 'pantry',          loadChildren: pantryRoutes,          canActivate: [authGuard] },
  { path: 'wearable',        loadChildren: wearableRoutes,        canActivate: [authGuard] },
  { path: 'analytics',       loadChildren: analyticsRoutes,       canActivate: [authGuard] },
  { path: 'subscription',    loadChildren: subscriptionsRoutes,   canActivate: [authGuard] },
  { path: '',                redirectTo: '/auth/login', pathMatch: 'full' },
  {
    path: '**',
    loadComponent: pageNotFound,
    title: `${baseTitle} - Page Not Found`,
  },
];
