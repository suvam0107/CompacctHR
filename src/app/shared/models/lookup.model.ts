// src/app/shared/models/lookup.model.ts

export interface LookupDepartment {
  id: number;
  name: string;
  code: string;
}

export interface LookupDesignation {
  id: number;
  name: string;
  departmentId: number;
}

export interface LookupLeaveType {
  id: number;
  code: string;
  name: string;
  defaultDays: number;
  applyDay?: number;
  minDay?: number;
  colourCode?: string;
  slNo?: number;
  attenCategory?: string;
  attenTypeCalc?: number;
}

export interface LookupAttendanceType {
  attenTypeId: number;
  attenType: string;
  attenCategory: string;
  shtDesc: string;
  attenTypeCalc: number;
  lsLeave: 'Y' | 'N';
  attendanceRequired: 'Y' | 'N';
  leaveType?: string | null;
  applyDay?: number | null;
  minDay?: string | null;
  colourCode: string;
  slNo: number;
}

export interface LookupHoliday {
  holidayId: number;
  hrYearId: number;
  holidayDate: string;
  locationId: number;
  purpose: string;
  attenTypeId: number;
}

export interface LookupHrYear {
  hrYearId: number;
  hrYearName: string;
  hrYearStart: string;
  hrYearEnd: string;
  monthStartDay: string;
  monthEndDay: string;
}

export interface LookupLocation {
  id: number;
  name: string;
  code: string;
}

export interface LookupGrade {
  id: number;
  name: string;
  code: string;
}

export interface LookupPersonalArea {
  id: number;
  name: string;
  code: string;
}

export interface LookupAllResponse {
  departments: LookupDepartment[];
  designations: LookupDesignation[];
  leaveTypes: LookupLeaveType[];
  attendanceTypes: LookupAttendanceType[];
  holidays: LookupHoliday[];
  hrYears: LookupHrYear[];
  locations: LookupLocation[];
  grades: LookupGrade[];
  personalAreas: LookupPersonalArea[];
  employmentTypes: { id: number; name: string }[];
  genders: { id: number; name: string }[];
  documentTypes: { id: number; name: string }[];
}
