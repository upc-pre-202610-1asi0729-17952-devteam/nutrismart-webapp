import { Routes } from '@angular/router';

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
  { path: 'onboarding',      loadChildren: onboardingRoutes },
  { path: 'profile',         loadChildren: profileRoutes },
  { path: 'dashboard',       loadChildren: dashboardRoutes },
  { path: 'nutrition',       loadChildren: nutritionRoutes },
  { path: 'smart-scan',      loadChildren: smartScanRoutes },
  { path: 'recommendations', loadChildren: recommendationsRoutes },
  { path: 'body-progress',   loadChildren: bodyProgressRoutes },
  { path: 'pantry',          loadChildren: pantryRoutes },
  { path: 'wearable',        loadChildren: wearableRoutes },
  { path: 'analytics',       loadChildren: analyticsRoutes },
  { path: 'subscription',    loadChildren: subscriptionsRoutes },
  { path: '',                redirectTo: '/dashboard', pathMatch: 'full' },
  {
    path: '**',
    loadComponent: pageNotFound,
    title: `${baseTitle} - Page Not Found`,
  },
];
