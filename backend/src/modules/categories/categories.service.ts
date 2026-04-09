import { Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Category, CategoryDocument } from '../../schemas/category.schema';
import { User, UserDocument } from '../../schemas/user.schema';
import { AppMigration, AppMigrationDocument } from '../../schemas/app-migration.schema';
import { Expense, ExpenseDocument } from '../../schemas/expense.schema';
import { Budget, BudgetDocument } from '../../schemas/budget.schema';
import { RecurringExpense, RecurringExpenseDocument } from '../../schemas/recurring-expense.schema';
import { VendorMapping, VendorMappingDocument } from '../../schemas/vendor-mapping.schema';
import {
  DEFAULT_CATEGORY_SEEDS,
  DEFAULT_CATEGORIES_MIGRATION_KEY,
  FALLBACK_CATEGORY_NAME,
} from './default-categories.seed';

@Injectable()
export class CategoriesService implements OnModuleInit {
  private readonly logger = new Logger(CategoriesService.name);

  constructor(
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(AppMigration.name) private appMigrationModel: Model<AppMigrationDocument>,
    @InjectModel(Expense.name) private expenseModel: Model<ExpenseDocument>,
    @InjectModel(Budget.name) private budgetModel: Model<BudgetDocument>,
    @InjectModel(RecurringExpense.name) private recurringExpenseModel: Model<RecurringExpenseDocument>,
    @InjectModel(VendorMapping.name) private vendorMappingModel: Model<VendorMappingDocument>,
  ) {}

  /**
   * Inserts default seed categories the user does not already have (by exact name).
   * Use for **signup** and **one-time migrations** only — not on every list fetch, or deleted defaults reappear.
   */
  async ensureDefaultsForUser(userId: string): Promise<number> {
    const uid = new Types.ObjectId(userId);
    const existing = await this.categoryModel.find({ userId: uid }).select('name').lean();
    const names = new Set(existing.map((c) => c.name));
    const toAdd = DEFAULT_CATEGORY_SEEDS.filter((d) => !names.has(d.name));
    if (toAdd.length === 0) return 0;
    await this.categoryModel.insertMany(toAdd.map((c) => ({ ...c, userId: uid })));
    return toAdd.length;
  }

  /** First-time / empty library: seed defaults. If the user already has any category, do nothing (respects deletions). */
  async ensureDefaultsIfEmpty(userId: string): Promise<number> {
    const uid = new Types.ObjectId(userId);
    const count = await this.categoryModel.countDocuments({ userId: uid });
    if (count > 0) return 0;
    return this.ensureDefaultsForUser(userId);
  }

  async onModuleInit() {
    const key = DEFAULT_CATEGORIES_MIGRATION_KEY;
    try {
      const done = await this.appMigrationModel.findOne({ key }).lean();
      if (done) return;

      const users = await this.userModel.find().select('_id').lean();
      let totalInserted = 0;
      for (const u of users) {
        const n = await this.ensureDefaultsForUser(u._id.toString());
        totalInserted += n;
      }
      await this.appMigrationModel.create({ key });
      this.logger.log(
        `Default categories migration "${key}": ${users.length} user(s), ${totalInserted} new category row(s) inserted`,
      );
    } catch (err) {
      this.logger.error(`Default categories migration failed: ${(err as Error).message}`);
    }
  }

  async findAll(userId: string) {
    return this.categoryModel
      .find({
        $or: [{ userId: new Types.ObjectId(userId) }, { isDefault: true, userId: { $exists: false } }],
      })
      .sort({ name: 1 });
  }

  async findByUser(userId: string) {
    return this.categoryModel.find({ userId: new Types.ObjectId(userId) }).sort({ name: 1 });
  }

  async create(userId: string, data: Partial<Category>) {
    return this.categoryModel.create({ ...data, userId: new Types.ObjectId(userId) });
  }

  async update(userId: string, id: string, data: Partial<Category>) {
    return this.categoryModel.findOneAndUpdate(
      { _id: id, userId: new Types.ObjectId(userId) },
      data,
      { new: true },
    );
  }

  /**
   * Resolves the "Other" bucket for reassigning data when a category is removed.
   * If the user is deleting their only "Other" row, creates a fresh one first.
   */
  private async getFallbackCategoryExcluding(userId: string, excludeCategoryId: Types.ObjectId) {
    const uid = new Types.ObjectId(userId);
    let fallback = await this.categoryModel
      .findOne({ userId: uid, name: FALLBACK_CATEGORY_NAME, _id: { $ne: excludeCategoryId } })
      .exec();
    if (!fallback) {
      const seed = DEFAULT_CATEGORY_SEEDS.find((s) => s.name === FALLBACK_CATEGORY_NAME);
      if (!seed) {
        throw new Error(`Seed missing for ${FALLBACK_CATEGORY_NAME}`);
      }
      fallback = await this.categoryModel.create({ ...seed, userId: uid });
    }
    return fallback;
  }

  /**
   * Removes a user-owned category. Expenses, budgets, recurring items, and vendor rules
   * that used it are reassigned to {@link FALLBACK_CATEGORY_NAME}.
   */
  async delete(userId: string, id: string) {
    const uid = new Types.ObjectId(userId);
    const catId = new Types.ObjectId(id);
    const cat = await this.categoryModel.findOne({ _id: catId, userId: uid }).lean();
    if (!cat) {
      throw new NotFoundException('Category not found');
    }
    const fallback = await this.getFallbackCategoryExcluding(userId, catId);
    const fid = fallback._id as Types.ObjectId;
    const fname = fallback.name;
    const reassign = { categoryId: fid, categoryName: fname };
    await Promise.all([
      this.expenseModel.updateMany({ userId: uid, categoryId: catId }, { $set: reassign }),
      this.budgetModel.updateMany({ userId: uid, categoryId: catId }, { $set: reassign }),
      this.recurringExpenseModel.updateMany({ userId: uid, categoryId: catId }, { $set: reassign }),
      this.vendorMappingModel.updateMany({ userId: uid, categoryId: catId }, { $set: reassign }),
    ]);
    await this.categoryModel.deleteOne({ _id: catId, userId: uid });
    return { deleted: true, reassignedTo: fname };
  }
}
