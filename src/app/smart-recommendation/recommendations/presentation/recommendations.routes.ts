/**
 * Recommendations routes (smart-recommendation context).
 *
 * Register weather-based and pantry-based recommendation views here.
 */
import { Routes } from '@angular/router';

export const recommendationsRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./views/recommendations/recommendations').then(m => m.RecommendationsView),
    title: 'NutriSmart - Recommendations',
  },
];
