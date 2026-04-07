import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Expense, ExpenseDocument } from '../../schemas/expense.schema';
import { VendorMapping, VendorMappingDocument } from '../../schemas/vendor-mapping.schema';
import { AutomationRule, AutomationRuleDocument } from '../../schemas/automation-rule.schema';
import { Budget, BudgetDocument } from '../../schemas/budget.schema';
import { Notification, NotificationDocument } from '../../schemas/notification.schema';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { QueryExpenseDto } from './dto/query-expense.dto';
import { escapeRegex } from '../../common/utils/sanitize';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectModel(Expense.name) private expenseModel: Model<ExpenseDocument>,
    @InjectModel(VendorMapping.name) private vendorMappingModel: Model<VendorMappingDocument>,
    @InjectModel(AutomationRule.name) private automationRuleModel: Model<AutomationRuleDocument>,
    @InjectModel(Budget.name) private budgetModel: Model<BudgetDocument>,
    @InjectModel(Notification.name) private notificationModel: Model<NotificationDocument>,
  ) {}

  async create(userId: string, dto: CreateExpenseDto): Promise<ExpenseDocument> {
    if (dto.vendor && !dto.categoryId) {
      const mapping = await this.vendorMappingModel.findOne({
        userId: new Types.ObjectId(userId),
        vendorPattern: { $regex: new RegExp(escapeRegex(dto.vendor), 'i') },
      });
      if (mapping) {
        dto.categoryId = mapping.categoryId.toString();
        dto.categoryName = mapping.categoryName;
      }
    }

    const expense = await this.expenseModel.create({
      ...dto,
      userId: new Types.ObjectId(userId),
      date: new Date(dto.date),
    });

    await this.applyAutomationRules(userId, expense);
    await this.checkBudgetAlerts(userId, expense);

    return expense;
  }

  async findAll(userId: string, query: QueryExpenseDto) {
    const filter: any = { userId: new Types.ObjectId(userId) };

    if (query.type) filter.type = query.type;
    if (query.categoryId) filter.categoryId = new Types.ObjectId(query.categoryId);
    if (query.paymentMethod) filter.paymentMethod = query.paymentMethod;
    if (query.startDate || query.endDate) {
      filter.date = {};
      if (query.startDate) filter.date.$gte = new Date(query.startDate);
      if (query.endDate) filter.date.$lte = new Date(query.endDate);
    }
    if (query.minAmount || query.maxAmount) {
      filter.amount = {};
      if (query.minAmount) filter.amount.$gte = query.minAmount;
      if (query.maxAmount) filter.amount.$lte = query.maxAmount;
    }
    if (query.search) {
      const safe = escapeRegex(query.search);
      filter.$or = [
        { description: { $regex: safe, $options: 'i' } },
        { vendor: { $regex: safe, $options: 'i' } },
        { categoryName: { $regex: safe, $options: 'i' } },
      ];
    }

    const page = query.page || 1;
    const limit = query.limit || 20;
    const sort: any = { [query.sortBy || 'date']: query.sortOrder === 'asc' ? 1 : -1 };

    const [data, total] = await Promise.all([
      this.expenseModel.find(filter).sort(sort).skip((page - 1) * limit).limit(limit).exec(),
      this.expenseModel.countDocuments(filter),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(userId: string, id: string): Promise<ExpenseDocument | null> {
    return this.expenseModel.findOne({ _id: id, userId: new Types.ObjectId(userId) });
  }

  async update(userId: string, id: string, dto: Partial<CreateExpenseDto>): Promise<ExpenseDocument | null> {
    return this.expenseModel.findOneAndUpdate(
      { _id: id, userId: new Types.ObjectId(userId) },
      { ...dto, date: dto.date ? new Date(dto.date) : undefined },
      { new: true },
    );
  }

  async delete(userId: string, id: string): Promise<void> {
    await this.expenseModel.deleteOne({ _id: id, userId: new Types.ObjectId(userId) });
  }

  async getMonthlyStats(userId: string, year: number, month: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const [expenses, income] = await Promise.all([
      this.expenseModel.aggregate([
        { $match: { userId: new Types.ObjectId(userId), type: 'expense', date: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      this.expenseModel.aggregate([
        { $match: { userId: new Types.ObjectId(userId), type: 'income', date: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ]);

    return {
      totalExpenses: expenses[0]?.total || 0,
      totalIncome: income[0]?.total || 0,
      savings: (income[0]?.total || 0) - (expenses[0]?.total || 0),
    };
  }

  async getOverallBalance(userId: string) {
    const [allExpenses, allIncome, monthExpenses, monthIncome, txCount] = await Promise.all([
      this.expenseModel.aggregate([
        { $match: { userId: new Types.ObjectId(userId), type: 'expense' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      this.expenseModel.aggregate([
        { $match: { userId: new Types.ObjectId(userId), type: 'income' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      this.expenseModel.aggregate([
        { $match: {
          userId: new Types.ObjectId(userId),
          type: 'expense',
          date: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
        }},
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      this.expenseModel.aggregate([
        { $match: {
          userId: new Types.ObjectId(userId),
          type: 'income',
          date: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
        }},
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      this.expenseModel.countDocuments({ userId: new Types.ObjectId(userId) }),
    ]);

    const totalExpensesAll = allExpenses[0]?.total || 0;
    const totalIncomeAll = allIncome[0]?.total || 0;
    const monthlyExpense = monthExpenses[0]?.total || 0;
    const monthlyIncome = monthIncome[0]?.total || 0;

    return {
      totalBalance: totalIncomeAll - totalExpensesAll,
      totalIncome: totalIncomeAll,
      totalExpenses: totalExpensesAll,
      monthlyIncome,
      monthlyExpenses: monthlyExpense,
      monthlySavings: monthlyIncome - monthlyExpense,
      transactionCount: txCount,
    };
  }

  async getCategoryBreakdown(userId: string, year: number, month: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    return this.expenseModel.aggregate([
      { $match: { userId: new Types.ObjectId(userId), type: 'expense', date: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: '$categoryName', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
    ]);
  }

  async getMonthlyTrends(userId: string, months: number = 6) {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    return this.expenseModel.aggregate([
      { $match: { userId: new Types.ObjectId(userId), date: { $gte: startDate } } },
      {
        $group: {
          _id: { year: { $year: '$date' }, month: { $month: '$date' }, type: '$type' },
          total: { $sum: '$amount' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);
  }

  async getWeeklySpending(userId: string) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 28);

    return this.expenseModel.aggregate([
      { $match: { userId: new Types.ObjectId(userId), type: 'expense', date: { $gte: startDate } } },
      {
        $group: {
          _id: { week: { $isoWeek: '$date' }, year: { $isoWeekYear: '$date' } },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.week': 1 } },
    ]);
  }

  async getSpendingPrediction(userId: string) {
    const months: number[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
      const result = await this.expenseModel.aggregate([
        { $match: { userId: new Types.ObjectId(userId), type: 'expense', date: { $gte: start, $lte: end } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]);
      months.push(result[0]?.total || 0);
    }

    const avg = months.reduce((a, b) => a + b, 0) / months.length;
    const trend = months.length >= 2 ? (months[months.length - 1] - months[0]) / months.length : 0;
    const predicted = Math.max(0, avg + trend);

    const incomeResult = await this.expenseModel.aggregate([
      {
        $match: {
          userId: new Types.ObjectId(userId),
          type: 'income',
          date: { $gte: new Date(new Date().getFullYear(), new Date().getMonth() - 5, 1) },
        },
      },
      { $group: { _id: { month: { $month: '$date' } }, total: { $sum: '$amount' } } },
    ]);
    const avgIncome = incomeResult.length ? incomeResult.reduce((a, b) => a + b.total, 0) / incomeResult.length : 0;

    return {
      predictedExpenses: Math.round(predicted),
      predictedSavings: Math.round(avgIncome - predicted),
      monthlyData: months,
      trend: trend > 0 ? 'increasing' : trend < 0 ? 'decreasing' : 'stable',
      avgMonthlyExpense: Math.round(avg),
    };
  }

  private async applyAutomationRules(userId: string, expense: ExpenseDocument) {
    const rules = await this.automationRuleModel.find({
      userId: new Types.ObjectId(userId),
      isActive: true,
    });

    for (const rule of rules) {
      const { field, operator, value } = rule.condition;
      const expenseValue = (expense as any)[field];
      let match = false;

      switch (operator) {
        case 'equals': match = expenseValue === value; break;
        case 'contains': match = String(expenseValue).toLowerCase().includes(String(value).toLowerCase()); break;
        case 'greater_than': match = Number(expenseValue) > Number(value); break;
        case 'less_than': match = Number(expenseValue) < Number(value); break;
      }

      if (match) {
        const { type: actionType, value: actionValue } = rule.action;
        switch (actionType) {
          case 'set_type':
            await this.expenseModel.findByIdAndUpdate(expense._id, { type: actionValue });
            break;
          case 'set_category':
            await this.expenseModel.findByIdAndUpdate(expense._id, { categoryName: actionValue });
            break;
          case 'notify':
            await this.notificationModel.create({
              userId: new Types.ObjectId(userId),
              title: 'Automation Alert',
              message: `Rule "${rule.name}" triggered for expense of ₹${expense.amount}`,
              type: 'automation',
            });
            break;
        }
      }
    }
  }

  private async checkBudgetAlerts(userId: string, expense: ExpenseDocument) {
    if (expense.type !== 'expense') return;

    const now = new Date();
    const budgets = await this.budgetModel.find({
      userId: new Types.ObjectId(userId),
      startDate: { $lte: now },
      endDate: { $gte: now },
    });

    for (const budget of budgets) {
      if (budget.categoryName && budget.categoryName !== expense.categoryName) continue;

      const startDate = new Date(budget.startDate);
      const endDate = new Date(budget.endDate);

      const result = await this.expenseModel.aggregate([
        {
          $match: {
            userId: new Types.ObjectId(userId),
            type: 'expense',
            date: { $gte: startDate, $lte: endDate },
            ...(budget.categoryName ? { categoryName: budget.categoryName } : {}),
          },
        },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]);

      const spent = result[0]?.total || 0;
      const percentage = (spent / budget.limit) * 100;

      if (percentage >= 100 && budget.alertAtLimit) {
        await this.notificationModel.create({
          userId: new Types.ObjectId(userId),
          title: 'Budget Exceeded!',
          message: `You've exceeded your ${budget.categoryName || 'overall'} budget of ₹${budget.limit}. Spent: ₹${spent}`,
          type: 'budget_alert',
        });
      } else if (percentage >= 80 && budget.alertAt80) {
        await this.notificationModel.create({
          userId: new Types.ObjectId(userId),
          title: 'Budget Warning',
          message: `You've used ${Math.round(percentage)}% of your ${budget.categoryName || 'overall'} budget (₹${spent}/₹${budget.limit})`,
          type: 'budget_alert',
        });
      }

      await this.budgetModel.findByIdAndUpdate(budget._id, { spent });
    }
  }

  async trainVendorMapping(userId: string, vendor: string, categoryId: string, categoryName: string) {
    return this.vendorMappingModel.findOneAndUpdate(
      { userId: new Types.ObjectId(userId), vendorPattern: vendor.toLowerCase() },
      { categoryId: new Types.ObjectId(categoryId), categoryName },
      { upsert: true, new: true },
    );
  }

  async getRecentTransactions(userId: string, limit: number = 10) {
    return this.expenseModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ date: -1 })
      .limit(limit)
      .exec();
  }
}
