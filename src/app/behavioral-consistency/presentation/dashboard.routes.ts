import { Routes } from '@angular/router';
import { BehavioralDashboard } from './views/behavioral-dashboard/behavioral-dashboard';

/**
 * Dashboard routes for the Behavioral Consistency bounded context.
 *
 * Registers the main behavioral dashboard view.
 */
export const dashboardRoutes: Routes = [
  {
    path: '',
    component: BehavioralDashboard,
  },
];
