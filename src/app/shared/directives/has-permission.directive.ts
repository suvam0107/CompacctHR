// src/app/shared/directives/has-permission.directive.ts
import {
  Directive,
  Input,
  TemplateRef,
  ViewContainerRef,
  inject,
  effect
} from '@angular/core';
import { AuthStore } from '../../core/auth/auth.store';

@Directive({
  selector: '[appHasPermission]',
  standalone: true
})
export class HasPermissionDirective {
  private templateRef = inject(TemplateRef<unknown>);
  private viewContainer = inject(ViewContainerRef);
  private authStore = inject(AuthStore);

  private requiredPermission: string | string[] = '';
  private hasView = false;

  constructor() {
    effect(() => {
      // Re-evaluate when auth permissions change
      const permissions = this.authStore.permissions();
      this.updateView(permissions);
    });
  }

  @Input() set appHasPermission(permission: string | string[]) {
    this.requiredPermission = permission;
    this.updateView(this.authStore.permissions());
  }

  private updateView(userPermissions: Set<string>): void {
    if (!this.requiredPermission) {
      if (!this.hasView) {
        this.viewContainer.createEmbeddedView(this.templateRef);
        this.hasView = true;
      }
      return;
    }

    let hasPermission = false;

    if (Array.isArray(this.requiredPermission)) {
      hasPermission = this.requiredPermission.some(p => userPermissions.has(p));
    } else {
      hasPermission = userPermissions.has(this.requiredPermission);
    }

    if (hasPermission && !this.hasView) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!hasPermission && this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
    }
  }
}
