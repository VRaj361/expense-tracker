import { Injectable, BadRequestException } from '@nestjs/common';
import { parse } from 'csv-parse/sync';
import * as XLSX from 'xlsx';
import type { BankProfileDocument } from '../../schemas/bank-profile.schema';

export interface ParsedTransaction {
  date: Date;
  description: string;
  withdrawal: number;
  deposit: number;
  balance?: number;
  type: 'expense' | 'income';
  amount: number;
}

@Injectable()
export class StatementParserService {

  parseFile(
    buffer: Buffer,
    filename: string,
    profile: BankProfileDocument,
  ): ParsedTransaction[] {
    const ext = filename.split('.').pop()?.toLowerCase();
    let rows: Record<string, string>[];

    if (ext === 'csv' || ext === 'txt') {
      rows = this.parseCSV(buffer, profile);
    } else if (ext === 'xlsx' || ext === 'xls') {
      rows = this.parseExcel(buffer, profile);
    } else {
      throw new BadRequestException(`Unsupported file format: .${ext}. Use CSV or Excel.`);
    }

    return this.mapToTransactions(rows, profile);
  }

  private parseCSV(buffer: Buffer, profile: BankProfileDocument): Record<string, string>[] {
    const content = buffer.toString('utf-8');
    const lines = content.split(/\r?\n/);

    const headerIdx = profile.headerRowIndex || 0;
    const dataLines = lines.slice(headerIdx).join('\n');

    const records = parse(dataLines, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      delimiter: profile.delimiter || ',',
      relax_column_count: true,
    });

    return records as Record<string, string>[];
  }

  private parseExcel(buffer: Buffer, profile: BankProfileDocument): Record<string, string>[] {
    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    const allRows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false });
    const headerIdx = profile.headerRowIndex || 0;

    if (headerIdx >= allRows.length) {
      throw new BadRequestException('Header row index exceeds file rows');
    }

    const headers = allRows[headerIdx].map((h: any) => String(h).trim());
    const dataRows = allRows.slice(headerIdx + 1);

    return dataRows
      .filter((row) => row.some((cell: any) => cell !== null && cell !== undefined && cell !== ''))
      .map((row) => {
        const obj: Record<string, string> = {};
        headers.forEach((h, i) => {
          obj[h] = row[i] != null ? String(row[i]).trim() : '';
        });
        return obj;
      });
  }

  private mapToTransactions(
    rows: Record<string, string>[],
    profile: BankProfileDocument,
  ): ParsedTransaction[] {
    const transactions: ParsedTransaction[] = [];

    for (const row of rows) {
      const dateStr = this.findColumn(row, profile.dateColumn);
      const description = this.findColumn(row, profile.descriptionColumn);

      if (!dateStr || !description) continue;

      const date = this.parseDate(dateStr, profile.dateFormat);
      if (!date || isNaN(date.getTime())) continue;

      let withdrawal = 0;
      let deposit = 0;

      if (profile.amountColumn) {
        const rawAmt = this.parseAmount(this.findColumn(row, profile.amountColumn));
        if (rawAmt < 0) {
          withdrawal = Math.abs(rawAmt);
        } else {
          deposit = rawAmt;
        }
      } else {
        if (profile.withdrawalColumn) {
          withdrawal = this.parseAmount(this.findColumn(row, profile.withdrawalColumn));
        }
        if (profile.depositColumn) {
          deposit = this.parseAmount(this.findColumn(row, profile.depositColumn));
        }
      }

      if (withdrawal === 0 && deposit === 0) continue;

      const balance = profile.balanceColumn
        ? this.parseAmount(this.findColumn(row, profile.balanceColumn))
        : undefined;

      const isIncome = deposit > 0 && withdrawal === 0;
      const amount = isIncome ? deposit : withdrawal;

      transactions.push({
        date,
        description: description.substring(0, 200),
        withdrawal,
        deposit,
        balance,
        type: isIncome ? 'income' : 'expense',
        amount,
      });
    }

    return transactions;
  }

  private findColumn(row: Record<string, string>, columnName: string): string {
    if (row[columnName] !== undefined) return row[columnName];

    const lower = columnName.toLowerCase();
    for (const key of Object.keys(row)) {
      if (key.toLowerCase() === lower) return row[key];
      if (key.toLowerCase().includes(lower)) return row[key];
    }

    return '';
  }

  private parseAmount(value: string): number {
    if (!value) return 0;
    const cleaned = value.replace(/[^0-9.\-]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  }

  private parseDate(dateStr: string, format: string): Date | null {
    if (!dateStr) return null;

    const cleaned = dateStr.trim();

    const nativeDate = new Date(cleaned);
    if (!isNaN(nativeDate.getTime()) && nativeDate.getFullYear() > 1990) {
      return nativeDate;
    }

    const fmt = (format || 'DD-MM-YYYY').toUpperCase();
    const separators = cleaned.match(/[\/\-\.]/g);
    const sep = separators?.[0] || '-';
    const parts = cleaned.split(sep);

    if (parts.length < 3) return null;

    const fmtParts = fmt.split(/[\/\-\.]/);
    let day = 1, month = 1, year = 2000;

    fmtParts.forEach((f, i) => {
      const val = parseInt(parts[i], 10);
      if (isNaN(val)) return;
      if (f.startsWith('D')) day = val;
      else if (f.startsWith('M')) month = val;
      else if (f.startsWith('Y')) year = val < 100 ? 2000 + val : val;
    });

    return new Date(year, month - 1, day);
  }
}
