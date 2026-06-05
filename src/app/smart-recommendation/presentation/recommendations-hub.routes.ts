import { Routes } from '@angular/router';
import { RecommendationsHub } from './views/recommendations-hub/recommendations-hub';

/** Lazy-loads the Recommendations feed view. */
const recommendationsView = () =>
  import('./views/recommendations/recommendations').then(m => m.RecommendationsView);

/** Lazy-loads the Location Search view (part of the feed flow). */
const locationSearch = () =>
  import('./views/location-search/location-search').then(m => m.LocationSearchView);

/** Lazy-loads the Pantry view. */
const pantryView = () =>
  import('./views/pantry/pantry').then(m => m.Pantry);

/**
 * Recommendations section routes.
 *
 * {@link RecommendationsHub} provides the tab bar. The `feed` path groups the
 * recommendations feed and location-search so `routerLinkActive` on the Feed
 * tab activates for both child URLs. `pantry` is the second tab.
 */
export const recommendationsHubRoutes: Routes = [
  {
    path: '',
    component: RecommendationsHub,
    children: [
      { path: '', redirectTo: 'feed', pathMatch: 'full' },
      {
        path: 'feed',
        children: [
          { path: '',               loadComponent: recommendationsView, title: 'NutriSmart - Recommendations' },
          { path: 'location-search', loadComponent: locationSearch,    title: 'NutriSmart - Set Location' },
        ],
      },
      { path: 'pantry', loadComponent: pantryView, title: 'NutriSmart - Pantry' },
    ],
  },
];
