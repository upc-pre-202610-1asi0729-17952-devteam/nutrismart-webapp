import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environment.development';

interface OWMGeocodingResult {
  name: string;
  country: string;
  state?: string;
  lat: number;
  lon: number;
}

export interface CityLocation {
  city: string;
  country: string;
}

@Injectable({ providedIn: 'root' })
export class GeocodingService {
  private http = inject(HttpClient);

  searchCities(query: string): Observable<CityLocation[]> {
    const url    = `https://api.openweathermap.org/geo/1.0/direct`;
    const params = { q: query, limit: '5', appid: environment.owmApiKey };
    return this.http.get<OWMGeocodingResult[]>(url, { params }).pipe(
      map(results => results.map(r => ({ city: r.name, country: r.country }))),
    );
  }

  reverseGeocode(lat: number, lon: number): Observable<CityLocation> {
    const url = `https://api.openweathermap.org/geo/1.0/reverse`;
    const params = { lat: String(lat), lon: String(lon), limit: '1', appid: environment.owmApiKey };

    return this.http.get<OWMGeocodingResult[]>(url, { params }).pipe(
      map(results => {
        if (!results || results.length === 0) {
          throw new Error('Could not determine city from coordinates');
        }
        return { city: results[0].name, country: results[0].country };
      }),
    );
  }
}
