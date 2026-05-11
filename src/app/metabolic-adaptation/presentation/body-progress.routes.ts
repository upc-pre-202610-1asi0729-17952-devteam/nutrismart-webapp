import { Routes } from '@angular/router';
import { bodyProgressGoalGuard } from '../application/body-progress-goal.guard';

export const bodyProgressRoutes: Routes = [
  {
    path: '',
    canActivate: [bodyProgressGoalGuard],
    loadComponent: () =>
      import('./views/body-progress-goal/body-progress-goal').then(
        m => m.GoalSelectionScreen,
      ),
    title: 'NutriSmart - Body Progress',
  },
  {
    path: 'change-goal',
    loadComponent: () =>
      import('./views/body-progress-goal/body-progress-goal').then(
        m => m.GoalSelectionScreen,
      ),
    title: 'NutriSmart - Body Progress',
  },
  {
    path: 'progress',
    loadComponent: () =>
      import('./views/body-progress/body-progress').then(m => m.BodyProgressView),
    title: 'NutriSmart - Body Progress',
  },
  {
    path: 'history',
    loadComponent: () =>
      import('./views/weight-history/weight-history').then(m => m.WeightHistoryView),
    title: 'NutriSmart - Weight History',
  },
];
