import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { WearableStore } from '../../../application/wearable.store';
import { consumeOAuthState } from '../../../infrastructure/oauth-google-health';

/**
 * OAuth2 redirect target (same-tab flow).
 *
 * Validates the CSRF `state` returned by Google, exchanges the authorization
 * code through the store, then returns to the wearable view signalling the
 * outcome via a `health` query param so it can surface the result.
 */
@Component({
  selector: 'app-oauth-health-callback',
  imports: [TranslatePipe],
  templateUrl: './oauth-health-callback.html',
  styleUrl: './oauth-health-callback.css',
})
export class OAuthHealthCallbackView implements OnInit {
  private readonly route  = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly store  = inject(WearableStore);

  protected readonly failed = signal(false);

  async ngOnInit(): Promise<void> {
    const params = this.route.snapshot.queryParamMap;
    const code   = params.get('code');
    const state  = params.get('state');
    const error  = params.get('error');

    if (error || !code || !consumeOAuthState(state)) {
      this.finish('error');
      return;
    }

    try {
      await this.store.connectGoogleHealth(code);
      this.finish('connected');
    } catch {
      this.finish('error');
    }
  }

  private finish(outcome: 'connected' | 'error'): void {
    this.router.navigate(['/wearable'], { queryParams: { health: outcome }, replaceUrl: true });
  }
}
