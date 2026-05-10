import { Routes } from '@angular/router';
import { AnalyticsDashboardComponent } from './views/analytics-dashboard/analytics-dashboard.component'; // Corrected import path

export const ANALYTICS_ROUTES: Routes = [
  {
    path: '',
    component: AnalyticsDashboardComponent,
    title: 'Analytics Dashboard',
  },
  // Potentially add more routes here for specific analytics views or reports
  // {
  //   path: 'export-pdf',
  //   component: ExportPdfReportViewComponent, // If it were a standalone route
  //   title: 'Export PDF Report',
  // },
];
