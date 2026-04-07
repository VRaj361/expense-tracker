import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RecurringExpense, RecurringExpenseDocument } from '../../schemas/recurring-expense.schema';
import { Expense, ExpenseDocument } from '../../schemas/expense.schema';

@Injectable()
export class RecurringService {
  private readonly logger = new Logger(RecurringService.name);

  constructor(
    @InjectModel(RecurringExpense.name) private recurringModel: Model<RecurringExpenseDocument>,
    @InjectModel(Expense.name) private expenseModel: Model<ExpenseDocument>,
  ) {}

  async findAll(userId: string) {
    return this.recurringModel.find({ userId: new Types.ObjectId(userId) }).sort({ nextDueDate: 1 });
  }

  async create(userId: string, data: Partial<RecurringExpense>) {
    return this.recurringModel.create({ ...data, userId: new Types.ObjectId(userId) });
  }

  async update(userId: string, id: string, data: Partial<RecurringExpense>) {
    return this.recurringModel.findOneAndUpdate(
      { _id: id, userId: new Types.ObjectId(userId) },
      data,
      { new: true },
    );
  }

  async delete(userId: string, id: string) {
    return this.recurringModel.deleteOne({ _id: id, userId: new Types.ObjectId(userId) });
  }

  @Cron(CronExpression.EVERY_HOUR)
  async processRecurring() {
    this.logger.log('Processing recurring expenses...');
    const now = new Date();
    const dueItems = await this.recurringModel.find({
      isActive: true,
      nextDueDate: { $lte: now },
    });

    for (const item of dueItems) {
      await this.expenseModel.create({
        userId: item.userId,
        amount: item.amount,
        type: item.type,
        categoryId: item.categoryId,
        categoryName: item.categoryName,
        date: now,
        description: item.description || `Recurring: ${item.categoryName}`,
        paymentMethod: item.paymentMethod,
        vendor: item.vendor,
        isRecurring: true,
        recurringExpenseId: item._id,
      });

      let nextDate = new Date(item.nextDueDate);
      switch (item.frequency) {
        case 'daily': nextDate.setDate(nextDate.getDate() + 1); break;
        case 'weekly': nextDate.setDate(nextDate.getDate() + 7); break;
        case 'monthly': nextDate.setMonth(nextDate.getMonth() + 1); break;
        case 'yearly': nextDate.setFullYear(nextDate.getFullYear() + 1); break;
      }

      await this.recurringModel.findByIdAndUpdate(item._id, {
        nextDueDate: nextDate,
        lastProcessedDate: now,
      });
    }
    this.logger.log(`Processed ${dueItems.length} recurring expenses`);
  }
}
