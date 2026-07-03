import { environment } from '../../../environments/environment.development';

/**
 * Browser-side helper for the Google Health OAuth2 authorization-code flow.
 *
 * Uses a same-tab full-page redirect (popups are unreliable here because Google's
 * consent screen sends `Cross-Origin-Opener-Policy: same-origin`, which severs the
 * opener↔popup link). The CSRF `state` is kept in `sessionStorage`, which survives
 * the round-trip since we stay in the same tab. Control returns to the app via the
 * `/oauth/health/callback` route.
 */

const GOOGLE_AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';
const DEFAULT_SCOPE        = 'https://www.googleapis.com/auth/googlehealth.activity_and_fitness.readonly';
const STORAGE_STATE_KEY    = 'nsmart_health_oauth_state';

/** A config value is usable only when non-empty and not an un-substituted `{PLACEHOLDER}`. */
function configured(value: string | undefined): value is string {
  return !!value && !value.startsWith('{');
}

/** The redirect URI Google will call back, defaulting to this origin. */
export function redirectUri(): string {
  return configured(environment.googleOAuthRedirectUri)
    ? environment.googleOAuthRedirectUri
    : `${window.location.origin}/oauth/health/callback`;
}

/** Whether a usable Google Health OAuth client id is configured. */
export function isHealthOAuthConfigured(): boolean {
  return configured(environment.googleHealthClientId);
}

/** Builds the Google authorization URL for the given opaque CSRF `state`. */
function buildAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id:              environment.googleHealthClientId,
    redirect_uri:           redirectUri(),
    response_type:          'code',
    scope:                  environment.googleHealthScope || DEFAULT_SCOPE,
    access_type:            'offline',
    include_granted_scopes: 'true',
    prompt:                 'consent',
    state,
  });
  return `${GOOGLE_AUTH_ENDPOINT}?${params.toString()}`;
}

/**
 * Begins the OAuth flow by redirecting the current tab to Google's consent screen.
 * Control returns to the app via the `/oauth/health/callback` route.
 */
export function startHealthOAuth(): void {
  const state = crypto.randomUUID();
  sessionStorage.setItem(STORAGE_STATE_KEY, state);
  window.location.href = buildAuthUrl(state);
}

/**
 * Validates and consumes the CSRF `state` returned by Google on the callback.
 * @returns true when the returned state matches the one we issued.
 */
export function consumeOAuthState(returnedState: string | null): boolean {
  const expected = sessionStorage.getItem(STORAGE_STATE_KEY);
  sessionStorage.removeItem(STORAGE_STATE_KEY);
  return !!expected && expected === returnedState;
}
