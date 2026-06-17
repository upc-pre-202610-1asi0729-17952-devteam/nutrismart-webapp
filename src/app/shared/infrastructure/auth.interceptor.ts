import { HttpInterceptorFn } from '@angular/common/http';

const SESSION_KEY = 'nutrismart_session';
const API_HOST = 'localhost:8080';

function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.includes(API_HOST)) return next(req);

  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return next(req);
    const session = JSON.parse(raw) as { token?: string };
    if (!session?.token) return next(req);
    if (isTokenExpired(session.token)) {
      localStorage.removeItem(SESSION_KEY);
      return next(req);
    }

    return next(req.clone({ setHeaders: { Authorization: `Bearer ${session.token}` } }));
  } catch {
    return next(req);
  }
};
