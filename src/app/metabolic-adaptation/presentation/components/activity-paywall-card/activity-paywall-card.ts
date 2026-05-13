import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-activity-paywall-card',
  imports: [TranslatePipe, RouterLink],
  templateUrl: './activity-paywall-card.html',
  styleUrl: './activity-paywall-card.css',
})
export class ActivityPaywallCard {}
