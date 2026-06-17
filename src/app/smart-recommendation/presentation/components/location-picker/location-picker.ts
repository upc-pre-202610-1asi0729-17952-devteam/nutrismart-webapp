import { Component, computed, Input, Output, EventEmitter, inject, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { WeatherContext } from '../../../domain/model/weather-context.entity';
import { CityLocation, GeocodingService } from '../../../../shared/infrastructure/geocoding.service';

@Component({
  selector: 'app-location-picker',
  imports: [TranslateModule],
  templateUrl: './location-picker.html',
  styleUrl: './location-picker.css',
})
export class LocationPicker {
  @Input() locations: WeatherContext[] = [];
  @Input() selectedCity: string        = '';
  @Input() currentLabel: string        = '';
  @Input() isTravelMode: boolean       = false;

  @Output() citySelected    = new EventEmitter<WeatherContext>();
  @Output() owmCitySelected = new EventEmitter<{ city: string; country: string }>();

  private geocoding = inject(GeocodingService);

  readonly isOpen             = signal<boolean>(false);
  readonly searchQuery        = signal<string>('');
  readonly owmSuggestions     = signal<CityLocation[]>([]);
  readonly suggestionsLoading = signal<boolean>(false);

  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  readonly filteredLocations = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return this.locations.slice(0, 3);
    return this.locations.filter(l => l.city.toLowerCase().includes(q));
  });

  readonly filteredOwmSuggestions = computed(() => {
    const existing = new Set(this.locations.map(l => l.city.toLowerCase()));
    return this.owmSuggestions().filter(s => !existing.has(s.city.toLowerCase()));
  });

  onInputFocus(): void {
    this.searchQuery.set('');
    this.owmSuggestions.set([]);
    this.isOpen.set(true);
  }

  onWrapperFocusOut(event: FocusEvent): void {
    const wrapper = event.currentTarget as HTMLElement;
    if (!wrapper.contains(event.relatedTarget as Node)) {
      this.isOpen.set(false);
    }
  }

  onQueryChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchQuery.set(value);

    if (this.searchTimer) clearTimeout(this.searchTimer);

    if (value.trim().length < 2) {
      this.owmSuggestions.set([]);
      return;
    }

    this.searchTimer = setTimeout(async () => {
      this.suggestionsLoading.set(true);
      try {
        const results = await firstValueFrom(this.geocoding.searchCities(value.trim()));
        this.owmSuggestions.set(results);
      } catch {
        this.owmSuggestions.set([]);
      } finally {
        this.suggestionsLoading.set(false);
      }
    }, 350);
  }

  onSelectCity(loc: WeatherContext): void {
    this.citySelected.emit(loc);
    this.searchQuery.set('');
    this.owmSuggestions.set([]);
    this.isOpen.set(false);
  }

  onSelectOwmCity(loc: CityLocation): void {
    this.owmCitySelected.emit({ city: loc.city, country: loc.country });
    this.searchQuery.set('');
    this.owmSuggestions.set([]);
    this.isOpen.set(false);
  }

}
