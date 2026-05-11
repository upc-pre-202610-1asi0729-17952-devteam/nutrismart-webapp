import { Routes } from '@angular/router';
import { BehavioralDashboard } from './views/behavioral-dashboard/behavioral-dashboard';

/**
 * Presentation routes for the Behavioral Consistency bounded context.
 *
 * Defines the screens related to behavioral tracking, consistency and
 * user habit adherence.
 */
export const behavioralConsistencyRoutes: Routes = [
  {
    path: 'behavioral',
    component: BehavioralDashboard,
  },
];
