import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { z } from 'zod';

/**
 * Creates an Angular ValidatorFn from a Zod schema.
 * Supports validating a single form control or an entire FormGroup / FormRecord value.
 */
export function zodFormValidator(schema: z.ZodTypeAny): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const result = schema.safeParse(control.value);
    if (result.success) {
      return null;
    }

    const errors: ValidationErrors = {};
    for (const issue of result.error.issues) {
      const key = issue.path.length > 0 ? issue.path.join('.') : 'zodError';
      errors[key] = issue.message;
    }

    return errors;
  };
}
