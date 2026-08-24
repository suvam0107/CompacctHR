// src/app/features/admin/pages/system-settings/system-settings.ts
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { AdminService } from '../../services/admin.service';

@Component({
  selector: 'app-system-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, ToggleSwitchModule, PageHeader],
  templateUrl: './system-settings.html',
  styleUrls: ['./system-settings.scss']
})
export class SystemSettings {
  protected adminService = inject(AdminService);

  isSaving = signal<boolean>(false);
  saveSuccess = signal<boolean>(false);

  onSaveSettings(): void {
    this.isSaving.set(true);
    this.saveSuccess.set(false);

    setTimeout(() => {
      this.isSaving.set(false);
      this.saveSuccess.set(true);
    }, 400);
  }
}
