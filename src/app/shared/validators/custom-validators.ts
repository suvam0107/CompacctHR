// src/app/shared/validators/custom-validators.ts
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export class CustomValidators {
  /**
   * Validates that an end date control is equal to or after a start date control in the same form group.
   */
  static dateRange(startDateKey: string, endDateKey: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const startCtrl = control.get(startDateKey);
      const endCtrl = control.get(endDateKey);

      if (!startCtrl || !endCtrl || !startCtrl.value || !endCtrl.value) {
        return null;
      }

      const startDate = new Date(startCtrl.value);
      const endDate = new Date(endCtrl.value);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return null;
      }

      if (endDate < startDate) {
        const error = { dateRangeInvalid: true };
        endCtrl.setErrors({ ...endCtrl.errors, ...error });
        return error;
      }

      // If previous dateRange error exists on endCtrl, clear it
      if (endCtrl.errors && endCtrl.errors['dateRangeInvalid']) {
        const { dateRangeInvalid, ...rest } = endCtrl.errors;
        endCtrl.setErrors(Object.keys(rest).length ? rest : null);
      }

      return null;
    };
  }

  /**
   * Validates that two fields have identical values (e.g. password & confirm password).
   */
  static matchFields(field1Key: string, field2Key: string, errorKey: string = 'fieldsMismatch'): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const field1 = control.get(field1Key);
      const field2 = control.get(field2Key);

      if (!field1 || !field2) {
        return null;
      }

      if (field2.errors && !field2.errors[errorKey]) {
        return null;
      }

      if (field1.value !== field2.value) {
        field2.setErrors({ ...field2.errors, [errorKey]: true });
        return { [errorKey]: true };
      } else {
        if (field2.errors && field2.errors[errorKey]) {
          const { [errorKey]: _, ...rest } = field2.errors;
          field2.setErrors(Object.keys(rest).length ? rest : null);
        }
        return null;
      }
    };
  }

  /**
   * Validates file size in bytes
   */
  static maxFileSize(maxBytes: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const file = control.value as File | null;
      if (!file || !(file instanceof File)) {
        return null;
      }

      if (file.size > maxBytes) {
        return {
          maxFileSize: {
            actualSize: file.size,
            maxSize: maxBytes
          }
        };
      }

      return null;
    };
  }

  /**
   * Validates allowed file extensions (e.g. ['pdf', 'png', 'jpg', 'jpeg'])
   */
  static allowedExtensions(allowed: string[]): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const file = control.value as File | null;
      if (!file || !(file instanceof File)) {
        return null;
      }

      const extension = file.name.split('.').pop()?.toLowerCase();
      if (!extension || !allowed.map(a => a.toLowerCase().replace('.', '')).includes(extension)) {
        return {
          invalidExtension: {
            actual: extension,
            allowed
          }
        };
      }

      return null;
    };
  }
}
