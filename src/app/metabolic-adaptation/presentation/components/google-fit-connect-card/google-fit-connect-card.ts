import { Component, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-google-fit-connect-card',
  imports: [TranslatePipe],
  templateUrl: './google-fit-connect-card.html',
  styleUrl: './google-fit-connect-card.css',
})
export class GoogleFitConnectCard {
  readonly connect = output<void>();

  onConnect(): void {
    this.connect.emit();
  }
}
