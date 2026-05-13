import { Routes } from '@angular/router';

export const recommendationsRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./views/recommendations/recommendations').then(m => m.RecommendationsView),
    title: 'NutriSmart - Recommendations',
  },
  {
    path: 'location-search',
    loadComponent: () =>
      import('./views/location-search/location-search').then(m => m.LocationSearchView),
    title: 'NutriSmart - Set Location',
  },
];
