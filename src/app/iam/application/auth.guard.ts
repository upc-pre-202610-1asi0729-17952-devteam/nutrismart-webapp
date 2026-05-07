import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { IamStore } from './iam.store';

export const authGuard: CanActivateFn = () => {
  const iamStore = inject(IamStore);
  const router = inject(Router);
  if (iamStore.isAuthenticated()) return true;
  return router.createUrlTree(['/auth/login']);
};
