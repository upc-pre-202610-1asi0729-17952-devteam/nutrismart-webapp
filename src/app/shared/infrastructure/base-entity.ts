/**
 * Minimal contract implemented by domain entities across bounded contexts.
 *
 * Every aggregate root or entity that needs to be persisted or transferred
 * over HTTP must satisfy this interface so that generic infrastructure
 * classes (e.g. `BaseApiEndpoint`) can operate on them uniformly.
 */
export interface BaseEntity {
  /** Unique numeric identifier assigned by the backend. */
  id: number;
}
