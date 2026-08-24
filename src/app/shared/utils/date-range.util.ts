// src/app/shared/utils/date-range.util.ts

export type DateRangePreset =
  | 'today'
  | 'yesterday'
  | 'this_week'
  | 'last_week'
  | 'this_month'
  | 'last_month'
  | 'this_quarter'
  | 'last_quarter'
  | 'this_year';

export interface DateRangeResult {
  startDate: Date;
  endDate: Date;
  label: string;
}

export function getDateRangePreset(preset: DateRangePreset): DateRangeResult {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (preset) {
    case 'today':
      return {
        startDate: new Date(today),
        endDate: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59),
        label: 'Today'
      };

    case 'yesterday': {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return {
        startDate: new Date(yesterday),
        endDate: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59),
        label: 'Yesterday'
      };
    }

    case 'this_week': {
      const day = today.getDay(); // 0 is Sunday
      const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Monday start
      const startOfWeek = new Date(today.setDate(diff));
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59);

      return {
        startDate: startOfWeek,
        endDate: endOfWeek,
        label: 'This Week'
      };
    }

    case 'last_week': {
      const day = today.getDay();
      const diff = today.getDate() - day - 6 + (day === 0 ? -6 : 1);
      const startOfLastWeek = new Date(today.setDate(diff));
      const endOfLastWeek = new Date(startOfLastWeek);
      endOfLastWeek.setDate(endOfLastWeek.getDate() + 6);
      endOfLastWeek.setHours(23, 59, 59);

      return {
        startDate: startOfLastWeek,
        endDate: endOfLastWeek,
        label: 'Last Week'
      };
    }

    case 'this_month': {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      return {
        startDate: startOfMonth,
        endDate: endOfMonth,
        label: 'This Month'
      };
    }

    case 'last_month': {
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      return {
        startDate: startOfLastMonth,
        endDate: endOfLastMonth,
        label: 'Last Month'
      };
    }

    case 'this_quarter': {
      const currentQuarter = Math.floor(now.getMonth() / 3);
      const startOfQuarter = new Date(now.getFullYear(), currentQuarter * 3, 1);
      const endOfQuarter = new Date(now.getFullYear(), (currentQuarter + 1) * 3, 0, 23, 59, 59);
      return {
        startDate: startOfQuarter,
        endDate: endOfQuarter,
        label: 'This Quarter'
      };
    }

    case 'last_quarter': {
      const lastQuarterMonth = Math.floor(now.getMonth() / 3) * 3 - 3;
      const startOfLastQuarter = new Date(now.getFullYear(), lastQuarterMonth, 1);
      const endOfLastQuarter = new Date(now.getFullYear(), lastQuarterMonth + 3, 0, 23, 59, 59);
      return {
        startDate: startOfLastQuarter,
        endDate: endOfLastQuarter,
        label: 'Last Quarter'
      };
    }

    case 'this_year': {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
      return {
        startDate: startOfYear,
        endDate: endOfYear,
        label: 'This Year'
      };
    }
  }
}
