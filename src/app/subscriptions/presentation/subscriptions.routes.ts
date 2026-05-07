/**
 * Subscriptions routes.
 *
 * Delegates to the IAM bounded context's {@link Subscription} view, which
 * lives in the IAM context because plan selection is part of the user
 * registration flow.
 */
import { Routes } from '@angular/router';

/** Lazy-loads the {@link Subscription} standalone component from the IAM context. */
const subscription = () =>
  import('../../iam/presentation/views/subscription/subscription').then(
    m => m.Subscription
  );

export const subscriptionsRoutes: Routes = [
  { path: '', loadComponent: subscription, data: { mode: 'setup' }, title: 'NutriSmart - Choose Your Plan' },
];

export const myPlanRoutes: Routes = [
  { path: '', loadComponent: subscription, data: { mode: 'manage' }, title: 'NutriSmart - My Plan' },
];
