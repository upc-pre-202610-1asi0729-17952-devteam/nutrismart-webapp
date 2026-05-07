import { Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

/**
 * Application footer component.
 *
 * Displays copyright information and technology credits. Uses ngx-translate
 * so the footer text adapts to the active UI language.
 */
@Component({
  selector: 'app-footer-content',
  imports: [TranslatePipe],
  templateUrl: './footer-content.html',
  styleUrl: './footer-content.css',
})
export class FooterContent {}
