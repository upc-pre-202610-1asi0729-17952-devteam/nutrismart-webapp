import { HttpInterceptorFn } from '@angular/common/http';

const SESSION_KEY = 'nutrismart_session';
const API_HOST = 'localhost:8080';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.includes(API_HOST)) return next(req);

  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) {
      console.log('[INTERCEPTOR] No session found for:', req.url);
      return next(req);
    }
    const session = JSON.parse(raw) as { token?: string };
    if (!session?.token) {
      console.log('[INTERCEPTOR] No token in session for:', req.url);
      return next(req);
    }

    return next(req.clone({ setHeaders: { Authorization: `Bearer ${session.token}` } }));
  } catch {
    return next(req);
  }
};
