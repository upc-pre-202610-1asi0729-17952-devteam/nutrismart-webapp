export abstract class DomainEvent {
  readonly occurredAt: string = new Date().toISOString();
  abstract readonly eventType: string;
}
