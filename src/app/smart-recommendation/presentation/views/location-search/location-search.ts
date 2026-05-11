import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { RecommendationsStore } from '../../../application/recommendations.store';

const KNOWN_CITIES: { city: string; country: string }[] = [
  { city: 'Lima',     country: 'Peru' },
  { city: 'Cusco',    country: 'Peru' },
  { city: 'Arequipa', country: 'Peru' },
];

@Component({
  selector: 'app-location-search',
  imports: [FormsModule, TranslatePipe],
  templateUrl: './location-search.html',
  styleUrl: './location-search.css',
})
export class LocationSearchView {
  protected store  = inject(RecommendationsStore);
  private router   = inject(Router);

  protected cityInput    = signal<string>('');
  protected readonly knownCities = KNOWN_CITIES;

  protected get canConfirm(): boolean {
    return this.cityInput().trim().length > 0;
  }

  selectCity(city: string, country: string): void {
    this.cityInput.set(city);
    this.confirm(city, country);
  }

  async confirm(city?: string, country?: string): Promise<void> {
    const c = city ?? this.cityInput().trim();
    if (!c) return;
    await this.store.activateTravelMode(c, country ?? '', true);
    this.router.navigate(['/recommendations']);
  }

  goBack(): void {
    this.router.navigate(['/recommendations']);
  }
}
