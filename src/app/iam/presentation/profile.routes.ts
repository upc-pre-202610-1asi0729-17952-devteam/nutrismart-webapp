/**
 * User profile routes.
 *
 * Lazy-loads the profile and settings view at the `/profile` path.
 */
import { Routes } from '@angular/router';

/** Lazy-loads the {@link Profile} standalone component. */
const profile = () => import('./views/profile/profile').then(m => m.Profile);

export const profileRoutes: Routes = [
  { path: '', loadComponent: profile, title: 'NutriSmart - Profile & Settings' },
];
