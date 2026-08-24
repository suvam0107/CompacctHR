// src/app/shared/components/file-upload/file-upload.ts
import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileSizePipe } from '../../pipes/file-size.pipe';

export interface UploadedFileInfo {
  file: File;
  name: string;
  size: number;
  type: string;
}

@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [CommonModule, FileSizePipe],
  templateUrl: './file-upload.html',
  styleUrls: ['./file-upload.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FileUpload {
  @Input() accept: string = '.pdf,.png,.jpg,.jpeg,.doc,.docx,.xlsx';
  @Input() maxSizeBytes: number = 10 * 1024 * 1024; // 10 MB default
  @Input() multiple: boolean = false;
  @Input() label: string = 'Upload Files';
  @Input() hint: string = 'Drag and drop files here or browse';

  @Output() filesSelected = new EventEmitter<File[]>();
  @Output() fileRemoved = new EventEmitter<File>();

  files = signal<File[]>([]);
  errorMessage = signal<string | null>(null);
  isDragging = signal<boolean>(false);

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);

    if (event.dataTransfer && event.dataTransfer.files) {
      this.handleFiles(Array.from(event.dataTransfer.files));
    }
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.handleFiles(Array.from(input.files));
    }
  }

  private handleFiles(incoming: File[]): void {
    this.errorMessage.set(null);

    // Validate size
    for (const file of incoming) {
      if (file.size > this.maxSizeBytes) {
        this.errorMessage.set(`File "${file.name}" exceeds maximum allowed size.`);
        return;
      }
    }

    if (this.multiple) {
      const updated = [...this.files(), ...incoming];
      this.files.set(updated);
      this.filesSelected.emit(updated);
    } else {
      const single = incoming.slice(0, 1);
      this.files.set(single);
      this.filesSelected.emit(single);
    }
  }

  removeFile(file: File, event: MouseEvent): void {
    event.stopPropagation();
    const updated = this.files().filter(f => f !== file);
    this.files.set(updated);
    this.fileRemoved.emit(file);
    this.filesSelected.emit(updated);
  }
}
