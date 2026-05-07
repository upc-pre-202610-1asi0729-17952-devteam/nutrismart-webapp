/**
 * Onboarding flow routes.
 *
 * Lazy-loads the multi-step onboarding wizard at the `/onboarding` path.
 */
import { Routes } from '@angular/router';

/** Lazy-loads the {@link Onboarding} standalone component. */
const onboarding = () =>
  import('./views/onboarding/onboarding').then(m => m.Onboarding);

export const onboardingRoutes: Routes = [
  { path: '', loadComponent: onboarding, title: 'NutriSmart - Get Started' },
];
