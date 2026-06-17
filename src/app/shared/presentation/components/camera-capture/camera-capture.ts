import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  AfterViewInit,
  Output,
  ViewChild,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';

/**
 * Standalone camera-capture component.
 *
 * Opens the device camera via WebRTC, shows a live preview, and emits the
 * captured frame as a base64 data-URL (image/jpeg).  Stops all media tracks
 * on destroy so the camera indicator light turns off.
 */
@Component({
  selector: 'app-camera-capture',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, TranslatePipe],
  templateUrl: './camera-capture.html',
  styleUrl: './camera-capture.css',
})
export class CameraCapture implements AfterViewInit, OnDestroy {
  @Input() title = '';

  @Output() captured  = new EventEmitter<string>();
  @Output() cancelled = new EventEmitter<void>();

  @ViewChild('videoEl', { static: false }) private videoEl!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasEl', { static: false }) private canvasEl!: ElementRef<HTMLCanvasElement>;

  protected cameraError = signal<string | null>(null);

  private stream: MediaStream | null = null;

  async ngAfterViewInit(): Promise<void> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
      });
      this.videoEl.nativeElement.srcObject = this.stream;
    } catch {
      this.cameraError.set('smart_scan.camera_error');
    }
  }

  ngOnDestroy(): void {
    this.stream?.getTracks().forEach(t => t.stop());
  }

  capture(): void {
    const video  = this.videoEl.nativeElement;
    const canvas = this.canvasEl.nativeElement;
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')!.drawImage(video, 0, 0);
    this.captured.emit(canvas.toDataURL('image/jpeg', 0.85));
  }

  cancel(): void {
    this.cancelled.emit();
  }
}
