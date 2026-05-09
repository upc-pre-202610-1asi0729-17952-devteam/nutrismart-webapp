/**
 * Subscriptions routes.
 *
 * @author Mora Rivera, Joel Fernando
 */
import { Routes } from '@angular/router';

const myPlan = () =>
  import('./views/my-plan/my-plan').then(m => m.MyPlan);

export const subscriptionsRoutes: Routes = [
  { path: '', loadComponent: myPlan, data: { mode: 'setup' }, title: 'NutriSmart - Choose Your Plan' },
];

export const myPlanRoutes: Routes = [
  { path: '', loadComponent: myPlan, data: { mode: 'manage' }, title: 'NutriSmart - My Plan' },
];
