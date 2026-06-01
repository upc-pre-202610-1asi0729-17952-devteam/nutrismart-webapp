import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

/**
 * Shell component that groups Daily Log and Smart Scan under a shared tab bar.
 *
 * Renders the tab navigation at the top of the content area (right-aligned) and
 * projects the active child route into the nested `<router-outlet>`.
 */
@Component({
  selector: 'app-nutrition-log-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, TranslatePipe],
  templateUrl: './nutrition-log-shell.html',
  styleUrl: './nutrition-log-shell.css',
})
export class NutritionLogShell {}
