import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { CityLocation, GeocodingService } from '../../../../shared/infrastructure/geocoding.service';
import { RecommendationsStore } from '../../../application/recommendations.store';

@Component({
  selector: 'app-location-search',
  imports: [TranslatePipe],
  templateUrl: './location-search.html',
  styleUrl: './location-search.css',
})
export class LocationSearchView {
  protected store    = inject(RecommendationsStore);
  private router     = inject(Router);
  private geocoding  = inject(GeocodingService);

  protected citySearchQuery   = signal<string>('');
  protected suggestions       = signal<CityLocation[]>([]);
  protected showSuggestions   = signal<boolean>(false);
  protected citiesLoading     = signal<boolean>(false);

  private selectedCity    = signal<string>('');
  private selectedCountry = signal<string>('');
  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  protected get canConfirm(): boolean {
    return this.selectedCity().trim().length > 0;
  }

  onCityInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.citySearchQuery.set(value);
    this.selectedCity.set('');
    this.selectedCountry.set('');

    if (this.searchTimer) clearTimeout(this.searchTimer);

    if (value.trim().length < 2) {
      this.suggestions.set([]);
      return;
    }

    this.searchTimer = setTimeout(async () => {
      this.citiesLoading.set(true);
      try {
        const results = await firstValueFrom(this.geocoding.searchCities(value.trim()));
        this.suggestions.set(results);
        this.showSuggestions.set(true);
      } catch {
        this.suggestions.set([]);
      } finally {
        this.citiesLoading.set(false);
      }
    }, 350);
  }

  selectSuggestion(city: string, country: string): void {
    this.citySearchQuery.set(`${city}, ${country}`);
    this.selectedCity.set(city);
    this.selectedCountry.set(country);
    this.suggestions.set([]);
    this.showSuggestions.set(false);
  }

  onInputBlur(): void {
    setTimeout(() => this.showSuggestions.set(false), 150);
  }

  async confirm(): Promise<void> {
    console.log('confirm() called');
    console.log('selectedCity:', this.selectedCity());
    console.log('selectedCountry:', this.selectedCountry());
    const city    = this.selectedCity().trim();
    const country = this.selectedCountry().trim();
    console.log('city after trim:', city);
    if (!city) {
      console.log('returning early — city is empty');
      return;
    }
    await this.store.activateTravelMode(city, country, true);
    this.router.navigate(['/recommendations']);
  }

  goBack(): void {
    this.router.navigate(['/recommendations']);
  }
}
