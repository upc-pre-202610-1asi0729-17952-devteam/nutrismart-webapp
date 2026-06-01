import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { IamStore } from './iam.store';

/**
 * Route guard that enforces a minimum subscription tier.
 *
 * Place it after `subscriptionGuard` in `canActivate` and set
 * `data: { requiredPlan: 'PRO' | 'PREMIUM' }` on the route.
 *
 * - `'PRO'`     → allows PRO and PREMIUM users through.
 * - `'PREMIUM'` → allows PREMIUM users only.
 *
 * Redirects users who lack the required tier to `/upgrade?plan=<requiredPlan>`
 * so they see an explicit upgrade screen instead of the generic billing panel.
 */
export const planGuard: CanActivateFn = (route) => {
  const iamStore = inject(IamStore);
  const router   = inject(Router);
  const user     = iamStore.currentUser();
  const required = route.data?.['requiredPlan'] as 'PRO' | 'PREMIUM' | undefined;

  if (!user) return router.createUrlTree(['/subscription']);

  const allowed =
    required === 'PREMIUM' ? user.isPremium() :
    required === 'PRO'     ? user.isPro()     :
    true;

  return allowed
    ? true
    : router.createUrlTree(['/upgrade'], { queryParams: { plan: required } });
};
