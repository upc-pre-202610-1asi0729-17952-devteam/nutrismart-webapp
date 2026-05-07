import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { LanguageSwitcher } from '../language-switcher/language-switcher';
import { FooterContent } from '../footer-content/footer-content';

@Component({
  selector: 'app-layout',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    TranslatePipe,
    LanguageSwitcher,
    FooterContent,
  ],
  templateUrl: './layout.html',
  styleUrl: './layout.css',
})
export class Layout {
  principalNav = signal([
    { link: '/dashboard',        label: 'nav.dashboard',        icon: '⊞' },
    { link: '/nutrition/log',    label: 'nav.daily_log',        icon: '✓' },
    { link: '/smart-scan',       label: 'nav.smart_scan',       icon: '◫' },
    { link: '/recommendations',  label: 'nav.recommendations',  icon: '◎' },
    { link: '/body-progress',    label: 'nav.body_progress',    icon: '〜' },
  ]);

  toolsNav = signal([
    { link: '/pantry',       label: 'nav.pantry',       icon: '♡' },
    { link: '/wearable',     label: 'nav.wearable',     icon: '▣' },
    { link: '/analytics',    label: 'nav.analytics',    icon: '↑' },
    { link: '/subscription', label: 'nav.subscription', icon: '◉' },
  ]);
}
