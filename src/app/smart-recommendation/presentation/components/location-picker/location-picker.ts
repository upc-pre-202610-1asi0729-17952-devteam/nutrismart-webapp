import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { WeatherContext } from '../../../domain/model/weather-context.entity';

@Component({
  selector: 'app-location-picker',
  imports: [TranslateModule],
  templateUrl: './location-picker.html',
  styleUrl: './location-picker.css',
})
export class LocationPicker {
  @Input() locations: WeatherContext[]  = [];
  @Input() selectedCity: string         = '';
  @Input() demoTemperature: number | null = null;

  @Output() citySelected        = new EventEmitter<WeatherContext>();
  @Output() temperatureChanged  = new EventEmitter<number>();
  @Output() closed              = new EventEmitter<void>();

  get sliderValue(): number {
    return this.demoTemperature ?? (this.selectedLocationTemp ?? 20);
  }

  private get selectedLocationTemp(): number | null {
    return this.locations.find(l => l.city === this.selectedCity)?.temperatureCelsius ?? null;
  }

  onSliderInput(event: Event): void {
    const value = +(event.target as HTMLInputElement).value;
    this.temperatureChanged.emit(value);
  }
}
