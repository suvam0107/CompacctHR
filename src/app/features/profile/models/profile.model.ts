// src/app/features/profile/models/profile.model.ts
import { EmployeeDetail360 } from '../../employees/models/employee.model';

export type ProfileData = EmployeeDetail360;

export interface ProfileUpdatePayload {
  phone: string;
  address: string;
}
