import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { IamStore } from './iam.store';

export const subscriptionGuard: CanActivateFn = () => {
  const iamStore = inject(IamStore);
  const router = inject(Router);
  const user = iamStore.currentUser();
  if (!user?.plan) return router.createUrlTree(['/subscription']);
  return true;
};
