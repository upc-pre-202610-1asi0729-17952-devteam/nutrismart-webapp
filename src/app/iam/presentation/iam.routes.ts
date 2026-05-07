/**
 * IAM authentication routes.
 *
 * Lazy-loads the login, register, and forgot-password views. The root `/auth`
 * path redirects to `/auth/login` by default.
 */
import { Routes } from '@angular/router';

/** Lazy-loads the {@link Login} standalone component. */
const login = () => import('./views/login/login').then(m => m.Login);

/** Lazy-loads the {@link Register} standalone component. */
const register = () => import('./views/register/register').then(m => m.Register);

/** Lazy-loads the {@link ForgotPassword} standalone component. */
const forgotPassword = () =>
  import('./views/forgot-password/forgot-password').then(m => m.ForgotPassword);

export const iamRoutes: Routes = [
  { path: 'login',           loadComponent: login,          title: 'NutriSmart - Sign In' },
  { path: 'register',        loadComponent: register,       title: 'NutriSmart - Create Account' },
  { path: 'forgot-password', loadComponent: forgotPassword, title: 'NutriSmart - Forgot Password' },
  { path: '',                redirectTo: 'login',           pathMatch: 'full' },
];
