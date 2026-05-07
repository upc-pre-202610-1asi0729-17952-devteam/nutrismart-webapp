import { Routes } from '@angular/router';

const pageNotFound = () =>
  import('./shared/presentation/views/page-not-found/page-not-found').then(
    m => m.PageNotFound
  );

const iamRoutes = () =>
  import('./iam/presentation/iam.routes').then(m => m.iamRoutes);

const onboardingRoutes = () =>
  import('./iam/presentation/onboarding.routes').then(m => m.onboardingRoutes);

const profileRoutes = () =>
  import('./iam/presentation/profile.routes').then(m => m.profileRoutes);

const dashboardRoutes = () =>
  import('./behavioral-consistency/presentation/dashboard.routes').then(
    m => m.dashboardRoutes
  );

const nutritionRoutes = () =>
  import('./nutrition-tracking/presentation/nutrition.routes').then(
    m => m.nutritionRoutes
  );

const smartScanRoutes = () =>
  import('./restaurant-intelligence/presentation/smart-scan.routes').then(
    m => m.smartScanRoutes
  );

const recommendationsRoutes = () =>
  import(
    './smart-recommendation/recommendations/presentation/recommendations.routes'
  ).then(m => m.recommendationsRoutes);

const bodyProgressRoutes = () =>
  import('./metabolic-adaptation/presentation/body-progress.routes').then(
    m => m.bodyProgressRoutes
  );

const pantryRoutes = () =>
  import(
    './smart-recommendation/pantry/presentation/pantry.routes'
  ).then(m => m.pantryRoutes);

const wearableRoutes = () =>
  import('./metabolic-adaptation/presentation/wearable.routes').then(
    m => m.wearableRoutes
  );

const analyticsRoutes = () =>
  import('./analytics/presentation/analytics.routes').then(
    m => m.analyticsRoutes
  );

const subscriptionsRoutes = () =>
  import('./subscriptions/presentation/subscriptions.routes').then(
    m => m.subscriptionsRoutes
  );

const baseTitle = 'NutriSmart';

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
