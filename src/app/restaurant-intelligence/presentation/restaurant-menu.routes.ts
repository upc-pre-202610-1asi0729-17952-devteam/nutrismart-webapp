/**
 * Restaurant Intelligence routes (menu analysis + plate scan orchestration).
 *
 * @author Del Aguila Del Aguila, Olenka Priscilla
 */
import { Routes } from '@angular/router';

const restaurantMenuView = () =>
  import('./views/restaurant-menu/restaurant-menu').then(m => m.RestaurantMenu);

export const restaurantMenuRoutes: Routes = [
  { path: '', loadComponent: restaurantMenuView, title: 'NutriSmart - Smart Scan' },
];
