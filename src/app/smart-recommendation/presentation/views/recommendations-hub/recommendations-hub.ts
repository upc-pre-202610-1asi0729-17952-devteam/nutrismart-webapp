import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

/**
 * Shell component that groups the recommendations feed and the pantry
 * under a shared tab bar.
 *
 * `feed` children (`''` and `location-search`) share the tab's active state
 * because Angular's non-exact `routerLinkActive` activates for any URL that
 * starts with the linked path (`feed`).
 */
@Component({
  selector: 'app-recommendations-hub',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, TranslatePipe],
  templateUrl: './recommendations-hub.html',
  styleUrl: './recommendations-hub.css',
})
export class RecommendationsHub {}
