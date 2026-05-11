/**
 * Pantry routes (smart-recommendation context).
 *
 * @author Del Aguila Del Aguila, Olenka Priscilla
 */
import { Routes } from '@angular/router';

const pantryView = () =>
  import('./views/pantry/pantry').then(m => m.Pantry);

export const pantryRoutes: Routes = [
  { path: '', loadComponent: pantryView, title: 'NutriSmart - Pantry' },
];
