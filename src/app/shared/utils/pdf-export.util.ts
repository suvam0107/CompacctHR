// src/app/shared/utils/pdf-export.util.ts
import * as pdfMakeModule from 'pdfmake/build/pdfmake';
import * as pdfFontsModule from 'pdfmake/build/vfs_fonts';
import { TDocumentDefinitions, TableCell, Content } from 'pdfmake/interfaces';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const pdfMake: any = pdfMakeModule;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const pdfFonts: any = pdfFontsModule;

try {
  if (pdfFonts?.pdfMake?.vfs) {
    pdfMake.vfs = pdfFonts.pdfMake.vfs;
  } else if (pdfFonts?.vfs) {
    pdfMake.vfs = pdfFonts.vfs;
  }
} catch {
  // Ignore fallback
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
export function exportToPdf<T extends Record<string, unknown>>(
  columns: PdfTableColumn<T>[],
  data: T[],
  options: PdfExportOptions
): void {
  const {
    filename = 'document',
    title,
    subtitle,
    orientation = 'portrait'
  } = options;

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
    const row: TableCell[] = columns.map(col => ({
      text: String(item[col.key as string] ?? ''),
      alignment: col.alignment || 'left',
      fillColor: isEven ? '#FFFFFF' : '#F7F9FC',
      style: 'tableCell'
    }));
    tableBody.push(row);
  });

  const content: Content[] = [
    { text: title, style: 'mainTitle' },
    ...(subtitle ? [{ text: subtitle, style: 'subtitle' }] : []),
    { text: '', margin: [0, 0, 0, 12] },
    {
      table: {
        headerRows: 1,
        widths: columns.map(c => c.width || '*'),
        body: tableBody
      },
      layout: {
        hLineWidth: (i: number, node: { table: { body: TableCell[][] } }) =>
          i === 0 || i === 1 || i === node.table.body.length ? 1 : 0.5,
        vLineWidth: () => 0,
        hLineColor: (i: number, node: { table: { body: TableCell[][] } }) =>
          i === 0 || i === 1 || i === node.table.body.length ? '#14539A' : '#E3E8EF',
        paddingLeft: () => 6,
        paddingRight: () => 6,
        paddingTop: () => 6,
        paddingBottom: () => 6
      }
    }
  ];

  const docDefinition: TDocumentDefinitions = {
    pageOrientation: orientation,
    pageSize: 'A4',
    pageMargins: [40, 60, 40, 60],
    header: {
      margin: [40, 20, 40, 0],
      columns: [
        {
          text: 'COMPACCT HR',
          fontSize: 12,
          bold: true,
          color: '#14539A'
        },
        {
          text: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
          alignment: 'right',
          fontSize: 9,
          color: '#6B7280'
        }
      ]
    },
    footer: (currentPage, pageCount) => ({
      margin: [40, 0, 40, 20],
      columns: [
        {
          text: 'Confidential - Internal Use Only',
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
    }),
    content,
    styles: {
      mainTitle: {
        fontSize: 16,
        bold: true,
        color: '#1F2937',
        margin: [0, 0, 0, 4]
      },
      subtitle: {
        fontSize: 10,
        color: '#6B7280',
        margin: [0, 0, 0, 8]
      },
      tableHeader: {
        fontSize: 9,
        bold: true,
        color: '#FFFFFF',
        fillColor: '#14539A'
      },
      tableCell: {
        fontSize: 9,
        color: '#1F2937'
      }
    },
    defaultStyle: {
      font: 'Roboto'
    }
  };

  pdfMake.createPdf(docDefinition).download(`${filename.replace(/\.pdf$/i, '')}_${new Date().toISOString().slice(0, 10)}.pdf`);
}
