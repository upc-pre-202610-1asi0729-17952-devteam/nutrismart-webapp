/**
 * Marker interface for HTTP response envelopes returned by API endpoints.
 *
 * Implement this interface on response DTOs that wrap a collection or add
 * pagination/metadata around the actual payload (e.g. `{ data: [], total: 0 }`).
 * When the API returns a plain array, use `BaseResource[]` directly instead.
 */
export interface BaseResponse {}

/**
 * Base contract for API resources that expose a numeric identifier.
 *
 * A *resource* is the raw JSON shape returned by the REST API before it is
 * mapped into a domain entity by a `BaseAssembler`.
 */
export interface BaseResource {
  /** Unique numeric identifier as returned by the API. */
  id: number;
}
