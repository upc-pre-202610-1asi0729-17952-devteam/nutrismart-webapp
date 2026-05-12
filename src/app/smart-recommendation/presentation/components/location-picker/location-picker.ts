import { Component, computed, EventEmitter, Input, Output, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { WeatherContext } from '../../../domain/model/weather-context.entity';

@Component({
  selector: 'app-location-picker',
  imports: [TranslateModule],
  templateUrl: './location-picker.html',
  styleUrl: './location-picker.css',
})
export class LocationPicker {
  @Input() locations: WeatherContext[]    = [];
  @Input() selectedCity: string           = '';
  @Input() currentLabel: string           = '';
  @Input() demoTemperature: number | null = null;
  @Input() isTravelMode: boolean          = false;

  @Output() citySelected       = new EventEmitter<WeatherContext>();
  @Output() temperatureChanged = new EventEmitter<number>();

  readonly isOpen      = signal<boolean>(false);
  readonly searchQuery = signal<string>('');

  readonly filteredLocations = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return this.locations;
    return this.locations.filter(l => l.city.toLowerCase().includes(q));
  });

  get sliderValue(): number {
    return this.demoTemperature ?? this.locations.find(l => l.city === this.selectedCity)?.temperatureCelsius ?? 20;
  }

  onInputFocus(): void {
    this.searchQuery.set('');
    this.isOpen.set(true);
  }

  onWrapperFocusOut(event: FocusEvent): void {
    const wrapper = event.currentTarget as HTMLElement;
    if (!wrapper.contains(event.relatedTarget as Node)) {
      this.isOpen.set(false);
    }
  }

  onQueryChange(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  onSelectCity(loc: WeatherContext): void {
    this.citySelected.emit(loc);
    this.searchQuery.set('');
    this.isOpen.set(false);
  }

  onSliderInput(event: Event): void {
    this.temperatureChanged.emit(+(event.target as HTMLInputElement).value);
  }
}
