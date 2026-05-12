import { Routes } from '@angular/router';

/** Lazy-loads the {@link SubscriptionPlans} standalone component. */
const subscriptionPlans = () =>
  import('./views/subscription-plans/subscription-plans').then(
    m => m.SubscriptionPlans,
  );

/** Post-onboarding plan selection gate. */
export const subscriptionsRoutes: Routes = [
  {
    path: '',
    loadComponent: subscriptionPlans,
    title: 'NutriSmart - Choose Your Plan',
  },
];

/** Active subscription management (my-plan section). */
export const myPlanRoutes: Routes = [
  {
    path: '',
    loadComponent: subscriptionPlans,
    title: 'NutriSmart - My Plan',
  },
];
