import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Budget, BudgetDocument } from '../../schemas/budget.schema';
import { Expense, ExpenseDocument } from '../../schemas/expense.schema';

@Injectable()
export class BudgetsService {
  constructor(
    @InjectModel(Budget.name) private budgetModel: Model<BudgetDocument>,
    @InjectModel(Expense.name) private expenseModel: Model<ExpenseDocument>,
  ) {}

  async findAll(userId: string, activeOnly?: boolean) {
    const filter: any = { userId: new Types.ObjectId(userId) };
    if (activeOnly) {
      const now = new Date();
      filter.endDate = { $gte: now };
    }

    const budgets = await this.budgetModel.find(filter).sort({ endDate: -1 });

    const result: any[] = [];
    for (const budget of budgets) {
      const expenseFilter: any = {
        userId: new Types.ObjectId(userId),
        type: 'expense',
        date: { $gte: budget.startDate, $lte: budget.endDate },
      };
      if (budget.categoryName) expenseFilter.categoryName = budget.categoryName;

      const agg = await this.expenseModel.aggregate([
        { $match: expenseFilter },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]);

      const spent = agg[0]?.total || 0;
      result.push({
        ...budget.toObject(),
        spent,
        percentage: Math.min(100, Math.round((spent / budget.limit) * 100)),
      });
    }
    return result;
  }

  async create(userId: string, data: Partial<Budget>) {
    return this.budgetModel.create({
      ...data,
      userId: new Types.ObjectId(userId),
      startDate: new Date(data.startDate as any),
      endDate: new Date(data.endDate as any),
    });
  }

  async update(userId: string, id: string, data: Partial<Budget>) {
    const update: any = { ...data };
    if (data.startDate) update.startDate = new Date(data.startDate as any);
    if (data.endDate) update.endDate = new Date(data.endDate as any);
    return this.budgetModel.findOneAndUpdate(
      { _id: id, userId: new Types.ObjectId(userId) },
      update,
      { new: true },
    );
  }

  async delete(userId: string, id: string) {
    return this.budgetModel.deleteOne({ _id: id, userId: new Types.ObjectId(userId) });
  }
}
