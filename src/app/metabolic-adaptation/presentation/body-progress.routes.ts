/**
 * Body progress routes (metabolic-adaptation context).
 *
 * ─ ''         → GoalSelectionScreen  (first view when tapping Body Progress in the nav)
 * ─ 'progress' → BodyProgressView     (WA_BP_LOSS or WA_BP_GAIN based on selected goal)
 */
import { Routes } from '@angular/router';

export const bodyProgressRoutes: Routes = [
  {
    path: '',
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
];
