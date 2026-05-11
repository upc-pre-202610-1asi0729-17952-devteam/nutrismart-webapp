/**
 * Smart Scan routes (restaurant-intelligence context).
 *
 * @author Del Aguila Del Aguila, Olenka Priscilla
 */
import { Routes } from '@angular/router';

const smartScanView = () =>
  import('./views/smart-scan/smart-scan').then(m => m.SmartScan);

export const smartScanRoutes: Routes = [
  { path: '', loadComponent: smartScanView, title: 'NutriSmart - Smart Scan' },
];
