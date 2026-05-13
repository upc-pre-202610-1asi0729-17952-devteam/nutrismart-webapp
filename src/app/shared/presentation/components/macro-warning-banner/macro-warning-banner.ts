import { Component, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

/**
 * Dumb banner component for macro threshold warnings.
 *
 * Renders a yellow banner at 80–99% and a red banner at ≥100%.
 * Both may appear simultaneously when different macros are at different thresholds.
 *
 * @example
 * <app-macro-warning-banner
 *   [approaching]="['nutrition.protein', 'nutrition.fats']"
 *   [exceeded]="['nutrition.calories']" />
 */
@Component({
  selector: 'app-macro-warning-banner',
  imports: [TranslatePipe],
  templateUrl: './macro-warning-banner.html',
  styleUrl: './macro-warning-banner.css',
})
export class MacroWarningBanner {
  /** i18n keys of macros that have reached 80–99% of their daily target. */
  readonly approaching = input<string[]>([]);
  /** i18n keys of macros that have reached or exceeded 100% of their daily target. */
  readonly exceeded    = input<string[]>([]);
}
