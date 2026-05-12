import { Routes } from '@angular/router';

export const wearableRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./views/physical-activity/physical-activity').then(
        m => m.PhysicalActivityView,
      ),
    title: 'NutriSmart - Physical Activity',
  },
];
