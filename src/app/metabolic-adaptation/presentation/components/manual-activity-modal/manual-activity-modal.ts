import { Component, input, output, signal, computed } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { DecimalPipe } from '@angular/common';
import { ActivityType } from '../../../domain/model/activity-type.value-object';

@Component({
  selector: 'app-manual-activity-modal',
  imports: [TranslatePipe, DecimalPipe],
  templateUrl: './manual-activity-modal.html',
  styleUrl: './manual-activity-modal.css',
})
export class ManualActivityModal {
  readonly estimatedCalories = input<number>(0);
  readonly userWeightKg      = input<number>(70);
  readonly isLoading         = input<boolean>(false);

  readonly save    = output<{ activityKey: string; durationMinutes: number }>();
  readonly cancel  = output<void>();
  readonly preview = output<{ activityKey: string; durationMinutes: number }>();

  readonly activityKeys = ActivityType.allKeys();

  readonly selectedActivity = signal<string>('');
  readonly durationInput    = signal<string>('');
  readonly durationError    = signal<string>('');

  readonly metValue = computed(() => {
    if (!this.selectedActivity()) return 0;
    try { return ActivityType.metFor(this.selectedActivity()); }
    catch { return 0; }
  });

  readonly isValid = computed(() =>
    !!this.selectedActivity() && this.parsedDuration() > 0 && !this.durationError(),
  );

  private parsedDuration(): number {
    const v = Number(this.durationInput());
    return isNaN(v) ? 0 : v;
  }

  onActivityChange(event: Event): void {
    const key = (event.target as HTMLSelectElement).value;
    this.selectedActivity.set(key);
    this.emitPreview();
  }

  onDurationInput(event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    this.durationInput.set(raw);
    const v = Number(raw);
    if (!raw || isNaN(v) || v <= 0) {
      this.durationError.set('physical_activity.modal.error_duration');
    } else if (v > 480) {
      this.durationError.set('physical_activity.modal.error_duration_max');
    } else {
      this.durationError.set('');
    }
    this.emitPreview();
  }

  private emitPreview(): void {
    const duration = this.parsedDuration();
    if (this.selectedActivity() && duration > 0) {
      this.preview.emit({ activityKey: this.selectedActivity(), durationMinutes: duration });
    }
  }

  onSave(): void {
    if (!this.isValid()) return;
    this.save.emit({
      activityKey:     this.selectedActivity(),
      durationMinutes: this.parsedDuration(),
    });
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
