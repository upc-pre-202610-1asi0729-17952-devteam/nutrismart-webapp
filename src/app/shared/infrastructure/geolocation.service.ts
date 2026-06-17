import { Injectable } from '@angular/core';

export interface Coordinates {
  lat: number;
  lon: number;
}

@Injectable({ providedIn: 'root' })
export class GeolocationService {
  getCurrentPosition(): Promise<Coordinates> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => resolve({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        }),
        (error) => {
          switch (error.code) {
            case GeolocationPositionError.PERMISSION_DENIED:
              reject(new Error('Geolocation permission denied by the user'));
              break;
            case GeolocationPositionError.POSITION_UNAVAILABLE:
              reject(new Error('Location information is unavailable'));
              break;
            case GeolocationPositionError.TIMEOUT:
              reject(new Error('Geolocation request timed out'));
              break;
            default:
              reject(new Error('An unknown geolocation error occurred'));
          }
        },
        { timeout: 10000, maximumAge: 300000 },
      );
    });
  }
}
