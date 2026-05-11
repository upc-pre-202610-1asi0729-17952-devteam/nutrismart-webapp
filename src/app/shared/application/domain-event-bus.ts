import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { DomainEvent } from '../domain/domain-event';

@Injectable({ providedIn: 'root' })
export class DomainEventBus {
  private readonly _events$ = new Subject<DomainEvent>();
  readonly events$ = this._events$.asObservable();

  publish(event: DomainEvent): void {
    this._events$.next(event);
  }
}
