import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-page-not-found',
  imports: [TranslatePipe],
  templateUrl: './page-not-found.html',
  styleUrl: './page-not-found.css',
})
export class PageNotFound {
  private router = inject(Router);

  get invalidPath(): string {
    return this.router.url;
  }

  goHome(): void {
    this.router.navigate(['/dashboard']);
  }
}
