import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { IamStore } from './iam.store';

const SESSION_KEY = 'nutrismart_session';

function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}

export const authGuard: CanActivateFn = () => {
  const iamStore = inject(IamStore);
  const router = inject(Router);

  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return router.createUrlTree(['/auth/login']);

  try {
    const session = JSON.parse(raw) as { token?: string };
    if (!session?.token) return router.createUrlTree(['/auth/login']);
    if (isTokenExpired(session.token)) {
      localStorage.removeItem(SESSION_KEY);
      return router.createUrlTree(['/auth/login']);
    }
  } catch {
    localStorage.removeItem(SESSION_KEY);
    return router.createUrlTree(['/auth/login']);
  }

  return iamStore.isAuthenticated() ? true : router.createUrlTree(['/auth/login']);
};
