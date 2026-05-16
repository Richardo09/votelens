import * as XLSX from "xlsx";
import { slugifyFileName } from "./format";

export type ExcelCellValue = string | number | boolean | Date | null;

export type ExcelSheetRows = ExcelCellValue[][];

type ColumnWidth = {
  wch: number;
};

/**
 * Memastikan nama file export selalu memakai ekstensi .xlsx.
 */
function normalizeXlsxFileName(fileName: string) {
  const safeName = slugifyFileName(fileName);

  if (safeName.endsWith(".xlsx")) {
    return safeName;
  }

  return `${safeName}.xlsx`;
}

/**
 * Membersihkan nama sheet agar sesuai batasan Excel.
 */
function normalizeSheetName(sheetName: string) {
  const cleaned = sheetName
    .replace(/[\\/?*[\]:]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned.slice(0, 31) || "Sheet";
}

/**
 * Membuat worksheet dari array dua dimensi.
 */
export function createWorksheet(rows: ExcelSheetRows, columnWidths?: number[]) {
  const worksheet = XLSX.utils.aoa_to_sheet(rows);

  if (columnWidths && columnWidths.length > 0) {
    worksheet["!cols"] = columnWidths.map<ColumnWidth>((width) => ({
      wch: width,
    }));
  }

  return worksheet;
}

/**
 * Mengunduh satu worksheet sebagai file Excel.
 */
export function downloadXlsxFile(params: {
  fileName: string;
  sheetName: string;
  rows: ExcelSheetRows;
  columnWidths?: number[];
}) {
  const workbook = XLSX.utils.book_new();
  const worksheet = createWorksheet(params.rows, params.columnWidths);

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    normalizeSheetName(params.sheetName)
  );

  XLSX.writeFile(workbook, normalizeXlsxFileName(params.fileName));
}

/**
 * Mengunduh tabel dashboard dengan judul, header, isi, dan footer.
 */
export function exportDashboardTable(params: {
  fileName: string;
  sheetName: string;
  title?: string;
  subtitle?: string;
  headers: string[];
  rows: ExcelSheetRows;
  footerRows?: ExcelSheetRows;
  columnWidths?: number[];
}) {
  const outputRows: ExcelSheetRows = [];

  if (params.title) {
    outputRows.push([params.title]);
  }

  if (params.subtitle) {
    outputRows.push([params.subtitle]);
  }

  if (params.title || params.subtitle) {
    outputRows.push([]);
  }

  outputRows.push(params.headers);
  outputRows.push(...params.rows);

  if (params.footerRows && params.footerRows.length > 0) {
    outputRows.push([]);
    outputRows.push(...params.footerRows);
  }

  downloadXlsxFile({
    fileName: params.fileName,
    sheetName: params.sheetName,
    rows: outputRows,
    columnWidths: params.columnWidths,
  });
}