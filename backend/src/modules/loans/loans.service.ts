import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Loan, LoanDocument } from '../../schemas/loan.schema';

@Injectable()
export class LoansService {
  private readonly logger = new Logger(LoansService.name);

  constructor(@InjectModel(Loan.name) private loanModel: Model<LoanDocument>) {}

  async findAll(userId: string) {
    return this.loanModel.find({ userId: new Types.ObjectId(userId) }).sort({ createdAt: -1 });
  }

  async create(userId: string, data: Partial<Loan>) {
    const startDate = new Date(data.startDate as any);
    const nextEmi = new Date(startDate);
    nextEmi.setMonth(nextEmi.getMonth() + 1);
    if (data.emiDay) nextEmi.setDate(data.emiDay);

    return this.loanModel.create({
      ...data,
      userId: new Types.ObjectId(userId),
      remainingBalance: data.loanAmount,
      extraPaid: 0,
      nextEmiDate: data.nextEmiDate || nextEmi,
      payments: [],
    });
  }

  async update(userId: string, id: string, data: Partial<Loan>) {
    return this.loanModel.findOneAndUpdate(
      { _id: id, userId: new Types.ObjectId(userId) },
      data,
      { new: true },
    );
  }

  async recordEmiPayment(userId: string, id: string) {
    const loan = await this.loanModel.findOne({ _id: id, userId: new Types.ObjectId(userId) });
    if (!loan || !loan.isActive) return null;

    const newPaidEmis = loan.paidEmis + 1;
    const newBalance = Math.max(0, loan.remainingBalance - loan.emiAmount);
    const nextDate = new Date(loan.nextEmiDate || new Date());
    nextDate.setMonth(nextDate.getMonth() + 1);

    const payment = {
      date: new Date(),
      amount: loan.emiAmount,
      type: 'emi',
      note: `EMI #${newPaidEmis}`,
    };

    return this.loanModel.findByIdAndUpdate(id, {
      $set: {
        paidEmis: newPaidEmis,
        remainingBalance: newBalance,
        nextEmiDate: nextDate,
        isActive: newBalance > 0,
      },
      $push: { payments: payment },
    }, { new: true });
  }

  async recordExtraPayment(userId: string, id: string, amount: number, note?: string) {
    const loan = await this.loanModel.findOne({ _id: id, userId: new Types.ObjectId(userId) });
    if (!loan || !loan.isActive) return null;

    const newBalance = Math.max(0, loan.remainingBalance - amount);

    const payment = {
      date: new Date(),
      amount,
      type: 'extra',
      note: note || 'Extra payment',
    };

    return this.loanModel.findByIdAndUpdate(id, {
      $set: {
        remainingBalance: newBalance,
        extraPaid: (loan.extraPaid || 0) + amount,
        isActive: newBalance > 0,
      },
      $push: { payments: payment },
    }, { new: true });
  }

  async getEmiSchedule(userId: string, id: string) {
    const loan = await this.loanModel.findOne({ _id: id, userId: new Types.ObjectId(userId) });
    if (!loan) return null;

    const schedule: any[] = [];
    let balance = loan.loanAmount;
    const monthlyRate = loan.interestRate / 12 / 100;

    for (let i = 1; i <= loan.tenure; i++) {
      const interest = balance * monthlyRate;
      const principal = loan.emiAmount - interest;
      balance = Math.max(0, balance - principal);
      schedule.push({
        month: i,
        emiAmount: loan.emiAmount,
        principal: Math.round(principal),
        interest: Math.round(interest),
        balance: Math.round(balance),
        isPaid: i <= loan.paidEmis,
      });
    }
    return { loan, schedule };
  }

  async delete(userId: string, id: string) {
    return this.loanModel.deleteOne({ _id: id, userId: new Types.ObjectId(userId) });
  }

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async processAutoDeductions() {
    const today = new Date();
    const dayOfMonth = today.getDate();

    const loans = await this.loanModel.find({
      isActive: true,
      autoDeduct: true,
      emiDay: dayOfMonth,
    });

    for (const loan of loans) {
      const lastPayment = loan.payments?.length
        ? loan.payments[loan.payments.length - 1]
        : null;

      if (lastPayment?.type === 'emi') {
        const lastDate = new Date(lastPayment.date);
        if (lastDate.getMonth() === today.getMonth() && lastDate.getFullYear() === today.getFullYear()) {
          continue;
        }
      }

      const newPaidEmis = loan.paidEmis + 1;
      const newBalance = Math.max(0, loan.remainingBalance - loan.emiAmount);
      const nextDate = new Date(today);
      nextDate.setMonth(nextDate.getMonth() + 1);
      nextDate.setDate(loan.emiDay);

      await this.loanModel.findByIdAndUpdate(loan._id, {
        $set: {
          paidEmis: newPaidEmis,
          remainingBalance: newBalance,
          nextEmiDate: nextDate,
          isActive: newBalance > 0,
        },
        $push: {
          payments: {
            date: today,
            amount: loan.emiAmount,
            type: 'emi',
            note: `Auto EMI #${newPaidEmis}`,
          },
        },
      });

      this.logger.log(`Auto-deducted EMI for loan "${loan.name}" - ₹${loan.emiAmount}`);
    }
  }
}
