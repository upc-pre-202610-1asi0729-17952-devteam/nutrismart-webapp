import { Routes } from '@angular/router';
import { AnalyticsDashboardComponent } from './views/analytics-dashboard/analytics-dashboard';

export const ANALYTICS_ROUTES: Routes = [
  {
    path: '',
    component: AnalyticsDashboardComponent,
    title: 'NutriSmart - Analytics',
  },
];
