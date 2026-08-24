// src/app/shared/utils/excel-export.util.ts
import ExcelJS from 'exceljs';

export interface ExcelColumn<T = Record<string, unknown>> {
  header: string;
  key: keyof T | string;
  width?: number;
  format?: string;
  align?: 'left' | 'center' | 'right';
}

export interface ExcelExportOptions {
  filename?: string;
  sheetName?: string;
  title?: string;
}

/**
 * Exports data to styled .xlsx file using ExcelJS
 */
export async function exportToExcel<T extends Record<string, unknown>>(
  columns: ExcelColumn<T>[],
  data: T[],
  options: ExcelExportOptions = {}
): Promise<void> {
  const {
    filename = 'export',
    sheetName = 'Sheet1',
    title
  } = options;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'CompacctHR ERP';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet(sheetName, {
    views: [{ state: 'frozen', xSplit: 0, ySplit: title ? 2 : 1 }]
  });

  // Set column keys and widths
  worksheet.columns = columns.map(col => ({
    key: col.key as string,
    width: col.width || Math.max(col.header.length + 5, 15)
  }));

  // Optional Document Title
  if (title) {
    const titleRow = worksheet.addRow([title]);
    titleRow.font = { name: 'Segoe UI', size: 14, bold: true, color: { argb: 'FF14539A' } };
    titleRow.height = 24;
    worksheet.mergeCells(1, 1, 1, Math.max(columns.length, 1));
  }

  // Header Row
  const headerRowValues = columns.map(c => c.header);
  const headerRow = worksheet.addRow(headerRowValues);
  headerRow.height = 26;

  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF14539A' } // Primary Brand Blue
    };
    cell.font = {
      name: 'Segoe UI',
      size: 11,
      bold: true,
      color: { argb: 'FFFFFFFF' } // White Text
    };
    cell.alignment = {
      vertical: 'middle',
      horizontal: 'center',
      wrapText: true
    };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFE3E8EF' } },
      left: { style: 'thin', color: { argb: 'FFE3E8EF' } },
      bottom: { style: 'thin', color: { argb: 'FFE3E8EF' } },
      right: { style: 'thin', color: { argb: 'FFE3E8EF' } }
    };
  });

  // Data Rows
  data.forEach((item, index) => {
    const rowValues = columns.map(col => {
      const val = item[col.key as string];
      return val !== null && val !== undefined ? val : '';
    });

    const row = worksheet.addRow(rowValues);
    row.height = 20;

    const isEven = index % 2 === 0;
    const bgArgb = isEven ? 'FFFFFFFF' : 'FFF7F9FC';

    row.eachCell((cell, colIndex) => {
      const colDef = columns[colIndex - 1];

      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: bgArgb }
      };

      cell.font = {
        name: 'Segoe UI',
        size: 10,
        color: { argb: 'FF1F2937' }
      };

      cell.alignment = {
        vertical: 'middle',
        horizontal: colDef?.align || 'left'
      };

      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE3E8EF' } },
        left: { style: 'thin', color: { argb: 'FFE3E8EF' } },
        bottom: { style: 'thin', color: { argb: 'FFE3E8EF' } },
        right: { style: 'thin', color: { argb: 'FFE3E8EF' } }
      };
    });
  });

  // Auto-fit column widths based on content
  worksheet.columns.forEach((col, idx) => {
    const colDef = columns[idx];
    if (colDef?.width) {
      col.width = colDef.width;
    } else {
      let maxLen = colDef?.header?.length || 10;
      data.forEach(item => {
        const val = String(item[colDef.key as string] ?? '');
        if (val.length > maxLen) {
          maxLen = val.length;
        }
      });
      col.width = Math.min(Math.max(maxLen + 4, 12), 40);
    }
  });

  // Generate buffer and trigger browser download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });

  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${filename.replace(/\.xlsx$/i, '')}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  anchor.click();
  window.URL.revokeObjectURL(url);
}
