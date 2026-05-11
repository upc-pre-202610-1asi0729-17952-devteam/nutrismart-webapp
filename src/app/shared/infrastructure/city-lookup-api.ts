import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { environment } from '../../environments/environment.development';

interface WeatherSnapshotResource {
  id: string;
  city: string;
}

@Injectable({ providedIn: 'root' })
export class CityLookupApi {
  private http = inject(HttpClient);

  getKnownCities(): Observable<string[]> {
    return this.http
      .get<WeatherSnapshotResource[]>(`${environment.apiBaseUrl}${environment.weatherSnapshotsEndpointPath}`)
      .pipe(
        map(list => [...new Set(list.map(w => w.city))].sort()),
        retry(2),
        catchError(err => throwError(() => err)),
      );
  }
}
