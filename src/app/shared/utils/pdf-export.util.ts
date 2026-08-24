// src/app/shared/utils/pdf-export.util.ts
import * as pdfMakeModule from 'pdfmake/build/pdfmake';
import * as pdfFontsModule from 'pdfmake/build/vfs_fonts';
import { TDocumentDefinitions, TableCell, Content } from 'pdfmake/interfaces';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const pdfMake: any = (pdfMakeModule as any).default || pdfMakeModule;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const pdfFonts: any = (pdfFontsModule as any).default || pdfFontsModule;

try {
  const vfs = pdfFonts?.pdfMake?.vfs || pdfFonts?.vfs || (pdfMakeModule as any)?.vfs;
  if (vfs) {
    pdfMake.vfs = vfs;
  }
} catch {
  // Ignore fallback
}

async function loadLogoBase64(): Promise<string | null> {
  try {
    const res = await fetch('assets/images/Compacctlogo.png');
    if (!res.ok) return null;
    const blob = await res.blob();
    return new Promise(resolve => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export interface PdfTableColumn<T = Record<string, unknown>> {
  header: string;
  key: keyof T | string;
  width?: string | number;
  alignment?: 'left' | 'center' | 'right';
}

export interface PdfExportOptions {
  filename?: string;
  title: string;
  subtitle?: string;
  orientation?: 'portrait' | 'landscape';
}

/**
 * Exports tabular data as a styled PDF document with CompacctHR branding
 */
export async function exportToPdf<T extends Record<string, unknown>>(
  columns: PdfTableColumn<T>[],
  data: T[],
  options: PdfExportOptions
): Promise<void> {
  const {
    filename = 'document',
    title,
    subtitle,
    orientation = 'landscape' // Default to Landscape for optimal ERP table width
  } = options;

  const logoBase64 = await loadLogoBase64();
  const logoElement = logoBase64
    ? { image: logoBase64, fit: [100, 32] }
    : { text: 'COMPACCT HR', fontSize: 13, bold: true, color: '#14539A', margin: [0, 6, 0, 0] };

  const tableBody: TableCell[][] = [];

  // Header row
  const headerRow: TableCell[] = columns.map(col => ({
    text: col.header,
    style: 'tableHeader',
    alignment: col.alignment || 'left'
  }));
  tableBody.push(headerRow);

  // Data rows
  data.forEach((item, index) => {
    const isEven = index % 2 === 0;
    const row: TableCell[] = columns.map(col => {
      const rawVal = item[col.key as string];
      let strVal = String(rawVal ?? '');
      if (typeof rawVal === 'string' && /^\d{4}-\d{2}-\d{2}/.test(rawVal)) {
        strVal = new Date(rawVal).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      }
      return {
        text: strVal,
        alignment: col.alignment || 'left',
        fillColor: isEven ? '#FFFFFF' : '#F7F9FC',
        style: 'tableCell'
      };
    });
    tableBody.push(row);
  });

  const content: Content[] = [
    ...(subtitle ? [{ text: subtitle, style: 'subtitle' }] : []),
    {
      table: {
        headerRows: 1,
        dontBreakRows: true,
        widths: columns.map(() => '*'), // Evenly distribute across landscape page width
        body: tableBody
      },
      layout: {
        hLineWidth: (i: number, node: { table: { body: TableCell[][] } }) =>
          i === 0 || i === 1 || i === node.table.body.length ? 1 : 0.5,
        vLineWidth: () => 0,
        hLineColor: (i: number, node: { table: { body: TableCell[][] } }) =>
          i === 0 || i === 1 || i === node.table.body.length ? '#14539A' : '#E3E8EF',
        paddingLeft: () => 5,
        paddingRight: () => 5,
        paddingTop: () => 5,
        paddingBottom: () => 5
      }
    }
  ];

  const docDefinition: TDocumentDefinitions = {
    pageOrientation: orientation,
    pageSize: 'A4',
    pageMargins: [30, 52, 30, 35],
    header: ((currentPage: number, pageCount: number) => ({
      margin: [30, 12, 30, 0],
      columns: [
        {
          width: 'auto',
          ...logoElement
        },
        {
          width: '*',
          text: title,
          fontSize: 14,
          bold: true,
          color: '#14539A',
          margin: [12, 6, 0, 0]
        },
        {
          width: 'auto',
          text: `Generated: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`,
          alignment: 'right',
          fontSize: 8.5,
          color: '#6B7280',
          margin: [0, 10, 0, 0]
        }
      ]
    })) as any,
    footer: ((currentPage: number, pageCount: number) => ({
      margin: [30, 8, 30, 15],
      columns: [
        {
          text: '© CompacctHR. All rights reserved.',
          fontSize: 8,
          color: '#9CA3AF'
        },
        {
          text: `Page ${currentPage} of ${pageCount}`,
          alignment: 'right',
          fontSize: 8,
          color: '#6B7280'
        }
      ]
    })) as any,
    content,
    styles: {
      subtitle: {
        fontSize: 9.5,
        color: '#6B7280',
        margin: [0, 0, 0, 6]
      },
      tableHeader: {
        fontSize: 8.5,
        bold: true,
        color: '#FFFFFF',
        fillColor: '#14539A'
      },
      tableCell: {
        fontSize: 8,
        color: '#1F2937'
      }
    },
    defaultStyle: {
      font: 'Roboto'
    }
  };

  try {
    const pdf = pdfMake.createPdf(docDefinition);
    pdf.download(`${filename.replace(/\.pdf$/i, '')}_${new Date().toISOString().slice(0, 10)}.pdf`);
  } catch (err) {
    console.error('Failed to generate PDF:', err);
  }
}
