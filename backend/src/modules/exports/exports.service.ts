import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Expense, ExpenseDocument } from '../../schemas/expense.schema';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const PDFDocument = require('pdfkit');
import * as ExcelJS from 'exceljs';
import { Parser } from 'json2csv';
import { escapeRegex } from '../../common/utils/sanitize';

@Injectable()
export class ExportsService {
  constructor(@InjectModel(Expense.name) private expenseModel: Model<ExpenseDocument>) {}

  private async getExpenses(userId: string, filters: {
    startDate?: string; endDate?: string; type?: string;
    categoryName?: string; paymentMethod?: string; search?: string;
  }) {
    const query: any = { userId: new Types.ObjectId(userId) };

    if (filters.startDate || filters.endDate) {
      query.date = {};
      if (filters.startDate) query.date.$gte = new Date(filters.startDate);
      if (filters.endDate) query.date.$lte = new Date(filters.endDate);
    }
    if (filters.type) query.type = filters.type;
    if (filters.categoryName) query.categoryName = filters.categoryName;
    if (filters.paymentMethod) query.paymentMethod = filters.paymentMethod;
    if (filters.search) {
      const safe = escapeRegex(filters.search);
      query.$or = [
        { description: { $regex: safe, $options: 'i' } },
        { vendor: { $regex: safe, $options: 'i' } },
        { categoryName: { $regex: safe, $options: 'i' } },
      ];
    }

    return this.expenseModel.find(query).sort({ date: -1 });
  }

  async exportCSV(userId: string, filters: any): Promise<string> {
    const expenses = await this.getExpenses(userId, filters);
    const data = expenses.map(e => ({
      Date: e.date.toLocaleDateString(),
      Type: e.type,
      Amount: e.amount,
      Category: e.categoryName || '',
      Description: e.description || '',
      PaymentMethod: e.paymentMethod || '',
      Vendor: e.vendor || '',
    }));
    const parser = new Parser({ fields: ['Date', 'Type', 'Amount', 'Category', 'Description', 'PaymentMethod', 'Vendor'] });
    return parser.parse(data);
  }

  async exportExcel(userId: string, filters: any): Promise<Buffer> {
    const expenses = await this.getExpenses(userId, filters);
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Expenses');

    sheet.columns = [
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Type', key: 'type', width: 10 },
      { header: 'Amount', key: 'amount', width: 15 },
      { header: 'Category', key: 'category', width: 20 },
      { header: 'Description', key: 'description', width: 30 },
      { header: 'Payment Method', key: 'paymentMethod', width: 15 },
      { header: 'Vendor', key: 'vendor', width: 20 },
    ];

    expenses.forEach(e => {
      sheet.addRow({
        date: e.date.toLocaleDateString(),
        type: e.type,
        amount: e.amount,
        category: e.categoryName || '',
        description: e.description || '',
        paymentMethod: e.paymentMethod || '',
        vendor: e.vendor || '',
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer as ArrayBuffer);
  }

  private formatINR(amount: number): string {
    const abs = Math.abs(amount);
    const formatted = abs >= 100000
      ? `${Math.floor(abs / 100000)},${String(Math.floor((abs % 100000) / 1000)).padStart(2, '0')},${String(Math.floor(abs % 1000)).padStart(3, '0')}`
      : abs >= 1000
      ? `${Math.floor(abs / 1000)},${String(Math.floor(abs % 1000)).padStart(3, '0')}`
      : String(Math.floor(abs));
    return `Rs. ${amount < 0 ? '-' : ''}${formatted}`;
  }

  async exportPDF(userId: string, filters: any): Promise<Buffer> {
    const expenses = await this.getExpenses(userId, filters);
    const startDate = filters.startDate || '';
    const endDate = filters.endDate || '';
    const pageW = 595.28;
    const margin = 40;
    const contentW = pageW - margin * 2;

    return new Promise((resolve) => {
      const doc = new PDFDocument({ margin, size: 'A4' });
      const buffers: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      const totalExpense = expenses.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0);
      const totalIncome = expenses.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0);
      const net = totalIncome - totalExpense;
      const sDate = new Date(startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      const eDate = new Date(endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

      // --- Header band ---
      doc.rect(0, 0, pageW, 90).fill('#4f46e5');
      doc.font('Helvetica-Bold').fontSize(22).fillColor('#ffffff')
        .text('FinTrack', margin, 25, { continued: false });
      doc.font('Helvetica').fontSize(10).fillColor('#c7d2fe')
        .text('Expense Report', margin, 52);
      doc.font('Helvetica').fontSize(9).fillColor('#c7d2fe')
        .text(`${sDate}  -  ${eDate}`, margin, 66);
      doc.font('Helvetica').fontSize(9).fillColor('#c7d2fe')
        .text(`Generated: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`, pageW - margin - 160, 66, { width: 160, align: 'right' });

      // --- Summary cards ---
      let y = 110;
      const cardW = (contentW - 20) / 3;

      const drawCard = (x: number, label: string, value: string, color: string) => {
        doc.rect(x, y, cardW, 50).lineWidth(0.5).fillAndStroke('#f9fafb', '#e5e7eb');
        doc.font('Helvetica').fontSize(8).fillColor('#6b7280').text(label, x + 10, y + 10, { width: cardW - 20 });
        doc.font('Helvetica-Bold').fontSize(13).fillColor(color).text(value, x + 10, y + 26, { width: cardW - 20 });
      };

      drawCard(margin, 'Total Income', this.formatINR(totalIncome), '#059669');
      drawCard(margin + cardW + 10, 'Total Expenses', this.formatINR(totalExpense), '#dc2626');
      drawCard(margin + (cardW + 10) * 2, 'Net Balance', this.formatINR(net), net >= 0 ? '#059669' : '#dc2626');

      y += 65;
      doc.font('Helvetica').fontSize(8).fillColor('#9ca3af')
        .text(`${expenses.length} transactions`, margin, y);
      y += 18;

      // --- Table ---
      const cols = [
        { header: 'Date', width: 72 },
        { header: 'Type', width: 48 },
        { header: 'Amount', width: 75 },
        { header: 'Category', width: 80 },
        { header: 'Description', width: contentW - 72 - 48 - 75 - 80 },
      ];
      const tableW = contentW;
      const rowH = 18;

      const drawTableHeader = (atY: number) => {
        doc.rect(margin, atY, tableW, rowH + 2).fill('#f3f4f6');
        let x = margin;
        for (const col of cols) {
          doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#374151')
            .text(col.header.toUpperCase(), x + 5, atY + 5, { width: col.width - 10, lineBreak: false });
          x += col.width;
        }
        return atY + rowH + 2;
      };

      const drawTableRow = (row: string[], atY: number, isAlt: boolean, typeColor: string) => {
        if (isAlt) {
          doc.rect(margin, atY, tableW, rowH).fill('#fafafa');
        }
        doc.rect(margin, atY, tableW, rowH).lineWidth(0.3).stroke('#e5e7eb');

        let x = margin;
        for (let i = 0; i < cols.length; i++) {
          const color = i === 2 ? typeColor : '#1f2937';
          const font = i === 2 ? 'Helvetica-Bold' : 'Helvetica';
          doc.font(font).fontSize(7.5).fillColor(color)
            .text(row[i], x + 5, atY + 5, { width: cols[i].width - 10, lineBreak: false });
          x += cols[i].width;
        }
        return atY + rowH;
      };

      y = drawTableHeader(y);

      for (let idx = 0; idx < expenses.length; idx++) {
        if (y > 760) {
          doc.addPage();
          y = 40;
          y = drawTableHeader(y);
        }

        const e = expenses[idx];
        const sign = e.type === 'income' ? '+' : '-';
        const typeColor = e.type === 'income' ? '#059669' : '#dc2626';
        const desc = e.description || e.vendor || '-';

        const row = [
          e.date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
          e.type === 'income' ? 'Income' : 'Expense',
          `${sign} ${this.formatINR(e.amount).replace('Rs. ', '')}`,
          e.categoryName || '-',
          desc.length > 50 ? desc.substring(0, 47) + '...' : desc,
        ];

        y = drawTableRow(row, y, idx % 2 === 1, typeColor);
      }

      // --- Footer ---
      y += 20;
      if (y > 750) { doc.addPage(); y = 40; }
      doc.moveTo(margin, y).lineTo(margin + contentW, y).lineWidth(0.3).stroke('#e5e7eb');
      y += 8;
      doc.font('Helvetica').fontSize(7).fillColor('#9ca3af')
        .text('FinTrack - Smart Expense Tracking | This report is auto-generated and confidential.', margin, y, { width: contentW, align: 'center' });

      doc.end();
    });
  }
}
