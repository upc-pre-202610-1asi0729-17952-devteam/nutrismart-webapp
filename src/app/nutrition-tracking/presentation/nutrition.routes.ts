/**
 * Nutrition tracking routes.
 *
 * @author Mora Rivera, Joel Fernando
 */
import { Routes } from '@angular/router';

const dailyLog = () =>
  import('./views/daily-log/daily-log').then(m => m.DailyLog);

export const nutritionRoutes: Routes = [
  { path: 'log',  loadComponent: dailyLog, title: 'NutriSmart - Daily Log' },
  { path: '',     redirectTo: 'log', pathMatch: 'full' },
];
