import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

/**
 * 404 — Page Not Found view.
 *
 * Displayed by the wildcard route (`**`) when the user navigates to a path
 * that does not match any registered route. Shows the invalid path in the
 * error message and provides a button to return to the dashboard.
 */
@Component({
  selector: 'app-page-not-found',
  imports: [TranslatePipe],
  templateUrl: './page-not-found.html',
  styleUrl: './page-not-found.css',
})
export class PageNotFound {
  private router = inject(Router);

  /** The current URL that triggered the 404, displayed in the error message. */
  get invalidPath(): string {
    return this.router.url;
  }

  /** Navigates the user back to the main dashboard. */
  goHome(): void {
    this.router.navigate(['/dashboard']);
  }
}
