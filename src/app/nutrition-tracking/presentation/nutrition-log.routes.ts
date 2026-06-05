import { Routes } from '@angular/router';
import { NutritionLogShell } from './views/nutrition-log-shell/nutrition-log-shell';

/** Lazy-loads the Daily Log standalone component. */
const dailyLog = () =>
  import('./views/daily-log/daily-log').then(m => m.DailyLog);

/** Lazy-loads the Smart Scan (restaurant-intelligence) standalone component. */
const smartScan = () =>
  import('../../restaurant-intelligence/presentation/views/restaurant-menu/restaurant-menu').then(
    m => m.RestaurantMenu,
  );

/**
 * Nutrition Log section routes.
 *
 * Renders {@link NutritionLogShell} as the parent layout (tab bar) and
 * projects `daily` or `smart-scan` into its nested `<router-outlet>`.
 */
export const nutritionLogRoutes: Routes = [
  {
    path: '',
    component: NutritionLogShell,
    children: [
      { path: '',          redirectTo: 'daily', pathMatch: 'full' },
      { path: 'daily',     loadComponent: dailyLog,  title: 'NutriSmart - Daily Log' },
      { path: 'smart-scan', loadComponent: smartScan, title: 'NutriSmart - Smart Scan' },
    ],
  },
];
