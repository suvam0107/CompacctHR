// src/app/shared/components/avatar/avatar.ts
import { Component, Input, computed, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InitialsPipe } from '../../pipes/initials.pipe';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type AvatarShape = 'circle' | 'square';
export type AvatarStatus = 'online' | 'offline' | 'busy' | 'away';

@Component({
  selector: 'app-avatar',
  standalone: true,
  imports: [CommonModule, InitialsPipe],
  templateUrl: './avatar.html',
  styleUrls: ['./avatar.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Avatar {
  @Input() name: string = '';
  @Input() imageUrl?: string | null;
  @Input() size: AvatarSize = 'md';
  @Input() shape: AvatarShape = 'circle';
  @Input() status?: AvatarStatus;
  @Input() bgColor?: string;

  imageError = signal<boolean>(false);

  // Derive stable background color if not provided
  avatarBg = computed(() => {
    if (this.bgColor) return this.bgColor;
    if (!this.name) return '#14539A';

    const colors = [
      '#14539A', // Brand Primary
      '#1E8E5A', // Success Green
      '#2B6CB0', // Info Blue
      '#7C3AED', // Violet
      '#D97706', // Amber
      '#059669', // Emerald
      '#4F46E5', // Indigo
      '#DB2777'  // Pink
    ];

    let hash = 0;
    for (let i = 0; i < this.name.length; i++) {
      hash = this.name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  });

  onImageError(): void {
    this.imageError.set(true);
  }
}
