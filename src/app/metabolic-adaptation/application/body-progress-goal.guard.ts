import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { IamStore } from '../../iam/application/iam.store';

export const bodyProgressGoalGuard: CanActivateFn = () => {
  const iamStore = inject(IamStore);
  const router   = inject(Router);
  if (iamStore.currentUser()?.goal) return router.createUrlTree(['/body-progress', 'progress']);
  return true;
};
