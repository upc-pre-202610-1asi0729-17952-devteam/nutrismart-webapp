import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { IamStore } from './iam.store';

export const onboardingGuard: CanActivateFn = () => {
  const iamStore = inject(IamStore);
  const router = inject(Router);
  if (!iamStore.isAuthenticated()) return router.createUrlTree(['/auth/login']);
  const user = iamStore.currentUser();
  if (user?.birthday && user?.biologicalSex) return router.createUrlTree(['/dashboard']);
  return true;
};
