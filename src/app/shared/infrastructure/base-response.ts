/**
 * Marker interface for HTTP response envelopes returned by API endpoints.
 */
export interface BaseResponse {}

/**
 * Base contract for API resources that expose a numeric identifier.
 */
export interface BaseResource {
  id: number;
}
