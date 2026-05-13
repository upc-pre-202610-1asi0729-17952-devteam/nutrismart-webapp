import { Component, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-manual-activity-card',
  imports: [TranslatePipe],
  templateUrl: './manual-activity-card.html',
  styleUrl: './manual-activity-card.css',
})
export class ManualActivityCard {
  readonly openModal = output<void>();

  onOpenModal(): void {
    this.openModal.emit();
  }
}
