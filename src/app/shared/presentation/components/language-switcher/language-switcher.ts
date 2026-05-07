import { Component, inject } from '@angular/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { TranslateService } from '@ngx-translate/core';

/**
 * Language switcher component.
 *
 * Renders a Material button-toggle group that lets the user switch the UI
 * language between English (`en`) and Spanish (`es`). The active language is
 * reflected immediately via ngx-translate.
 */
@Component({
  selector: 'app-language-switcher',
  imports: [MatButtonToggleModule],
  templateUrl: './language-switcher.html',
  styleUrl: './language-switcher.css',
})
export class LanguageSwitcher {
  private translate = inject(TranslateService);

  /** Returns the currently active language code (e.g. `'en'` or `'es'`). */
  get currentLang(): string {
    return this.translate.currentLang;
  }

  /**
   * Switches the active UI language.
   *
   * @param lang - BCP-47 language tag to activate (`'en'` or `'es'`).
   */
  switchLanguage(lang: string): void {
    this.translate.use(lang);
  }
}
