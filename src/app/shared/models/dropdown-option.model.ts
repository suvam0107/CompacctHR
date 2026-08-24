// src/app/shared/models/dropdown-option.model.ts

export interface DropdownOption<T = string | number> {
  label: string;
  value: T;
  icon?: string;
  disabled?: boolean;
  code?: string;
}
