import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { IamStore } from './iam.store';
import { SubscriptionsStore } from '../../subscriptions/application/subscriptions.store';

export const subscriptionGuard: CanActivateFn = async () => {
  const iamStore = inject(IamStore);
  const subStore = inject(SubscriptionsStore);
  const router = inject(Router);
  const user = iamStore.currentUser();

  if (!user?.plan) return router.createUrlTree(['/subscription']);

  if (user.planExpiresAt && new Date(user.planExpiresAt) < new Date()) {
    // Verify whether the subscription is genuinely expired or planExpiresAt is stale.
    if (!subStore.hasActivePlan()) {
      await subStore.initialise(user.id);
    }
    if (subStore.hasActivePlan()) {
      // Subscription is still active — planExpiresAt in IamStore is stale. Clear it.
      iamStore.clearPlanExpiry();
      return true;
    }
    // Subscription truly ended — clear plan and send user to choose a new one.
    iamStore.clearPlan();
    return router.createUrlTree(['/subscription']);
  }

  return true;
};
