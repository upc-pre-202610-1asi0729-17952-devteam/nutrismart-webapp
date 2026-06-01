import { Routes } from '@angular/router';
import { authGuard } from './iam/application/auth.guard';
import { onboardingGuard } from './iam/application/onboarding.guard';
import { subscriptionGuard } from './iam/application/subscription.guard';
import { planGuard } from './iam/application/plan.guard';

/**
 * Lazy-loads the PageNotFound standalone component.
 * Used as the wildcard (`**`) catch-all route.
 */
const pageNotFound = () =>
  import('./shared/presentation/views/page-not-found/page-not-found').then((m) => m.PageNotFound);

/** Lazy-loads the IAM (authentication) child routes. */
const iamRoutes = () => import('./iam/presentation/iam.routes').then((m) => m.iamRoutes);

/** Lazy-loads the onboarding child routes. */
const onboardingRoutes = () =>
  import('./iam/presentation/onboarding.routes').then((m) => m.onboardingRoutes);

/** Lazy-loads the user profile child routes. */
const profileRoutes = () =>
  import('./iam/presentation/profile.routes').then((m) => m.profileRoutes);

/** Lazy-loads the dashboard child routes (behavioral-consistency context). */
const dashboardRoutes = () =>
  import('./behavioral-consistency/presentation/behavioral-consistency.routes').then((m) => m.behavioralConsistencyRoutes);

/** Lazy-loads the Nutrition Log shell routes (Daily Log + Smart Scan tabs). */
const nutritionLogRoutes = () =>
  import('./nutrition-tracking/presentation/nutrition-log.routes').then((m) => m.nutritionLogRoutes);

/** Lazy-loads the Recommendations hub routes (Feed + Pantry tabs). */
const recommendationsHubRoutes = () =>
  import('./smart-recommendation/presentation/recommendations-hub.routes').then(
    (m) => m.recommendationsHubRoutes,
  );

/** Lazy-loads the body progress child routes (metabolic-adaptation context). */
const bodyProgressRoutes = () =>
  import('./metabolic-adaptation/presentation/body-progress.routes').then(
    (m) => m.bodyProgressRoutes,
  );

/** Lazy-loads the wearable child routes (metabolic-adaptation context). */
const wearableRoutes = () =>
  import('./metabolic-adaptation/presentation/wearable.routes').then((m) => m.wearableRoutes);

/** Lazy-loads the analytics child routes. */
const analyticsRoutes = () =>
  import('./analytics/presentation/analytics.routes').then((m) => m.ANALYTICS_ROUTES);

/** Lazy-loads the subscriptions child routes (post-onboarding gate). */
const subscriptionsRoutes = () =>
  import('./subscriptions/presentation/subscriptions.routes').then((m) => m.subscriptionsRoutes);

/** Lazy-loads the my-plan child routes (active subscription management). */
const myPlanRoutes = () =>
  import('./subscriptions/presentation/subscriptions.routes').then((m) => m.myPlanRoutes);

const baseTitle = 'NutriSmart';

/**
 * Application route tree.
 *
 * All bounded-context routes are lazy-loaded so each team can work
 * independently without touching this file. The wildcard route renders
 * `PageNotFound` for any unregistered path.
 */
export const routes: Routes = [
  { path: 'auth', loadChildren: iamRoutes },
  { path: 'onboarding', loadChildren: onboardingRoutes, canActivate: [onboardingGuard] },
  { path: 'profile', loadChildren: profileRoutes, canActivate: [authGuard, subscriptionGuard] },
  { path: 'dashboard',      loadChildren: dashboardRoutes,          canActivate: [authGuard, subscriptionGuard] },
  { path: 'nutrition-log',  loadChildren: nutritionLogRoutes,        canActivate: [authGuard, subscriptionGuard] },
  { path: 'recommendations', loadChildren: recommendationsHubRoutes, canActivate: [authGuard, subscriptionGuard, planGuard], data: { requiredPlan: 'PRO' } },
  { path: 'body-progress',  loadChildren: bodyProgressRoutes,        canActivate: [authGuard, subscriptionGuard] },
  // Redirect legacy routes to the new grouped sections
  { path: 'nutrition',   redirectTo: '/nutrition-log/daily',          pathMatch: 'prefix' },
  { path: 'smart-scan',  redirectTo: '/nutrition-log/smart-scan',     pathMatch: 'prefix' },
  { path: 'pantry',      redirectTo: '/recommendations/pantry',       pathMatch: 'prefix' },
  { path: 'wearable', loadChildren: wearableRoutes, canActivate: [authGuard, subscriptionGuard, planGuard], data: { requiredPlan: 'PRO' } },
  { path: 'analytics', loadChildren: analyticsRoutes, canActivate: [authGuard, subscriptionGuard, planGuard], data: { requiredPlan: 'PRO' } },
  { path: 'subscription', loadChildren: subscriptionsRoutes, canActivate: [authGuard] },
  { path: 'my-plan', loadChildren: myPlanRoutes, canActivate: [authGuard, subscriptionGuard] },
  { path: '', redirectTo: '/auth/login', pathMatch: 'full' },
  {
    path: '**',
    loadComponent: pageNotFound,
    title: `${baseTitle} - Page Not Found`,
  },
];
