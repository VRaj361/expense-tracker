import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Category, CategoryDocument } from '../../schemas/category.schema';

const DEFAULT_CATEGORIES = [
  { name: 'Food & Dining', icon: 'utensils', color: '#ef4444', type: 'expense', isDefault: true },
  { name: 'Shopping', icon: 'shopping-bag', color: '#f59e0b', type: 'expense', isDefault: true },
  { name: 'Transport', icon: 'car', color: '#3b82f6', type: 'expense', isDefault: true },
  { name: 'Bills & Utilities', icon: 'zap', color: '#8b5cf6', type: 'expense', isDefault: true },
  { name: 'Entertainment', icon: 'film', color: '#ec4899', type: 'expense', isDefault: true },
  { name: 'Health', icon: 'heart', color: '#10b981', type: 'expense', isDefault: true },
  { name: 'Education', icon: 'book', color: '#06b6d4', type: 'expense', isDefault: true },
  { name: 'Groceries', icon: 'shopping-cart', color: '#84cc16', type: 'expense', isDefault: true },
  { name: 'Rent', icon: 'home', color: '#f97316', type: 'expense', isDefault: true },
  { name: 'Salary', icon: 'briefcase', color: '#22c55e', type: 'income', isDefault: true },
  { name: 'Freelance', icon: 'laptop', color: '#14b8a6', type: 'income', isDefault: true },
  { name: 'Investment Returns', icon: 'trending-up', color: '#6366f1', type: 'income', isDefault: true },
  { name: 'Other', icon: 'more-horizontal', color: '#6b7280', type: 'both', isDefault: true },
];

@Injectable()
export class CategoriesService {
  constructor(@InjectModel(Category.name) private categoryModel: Model<CategoryDocument>) {}

  async initDefaults(userId: string) {
    const existing = await this.categoryModel.findOne({ userId: new Types.ObjectId(userId) });
    if (!existing) {
      const cats = DEFAULT_CATEGORIES.map(c => ({ ...c, userId: new Types.ObjectId(userId) }));
      await this.categoryModel.insertMany(cats);
    }
  }

  async findAll(userId: string) {
    return this.categoryModel.find({
      $or: [{ userId: new Types.ObjectId(userId) }, { isDefault: true, userId: { $exists: false } }],
    }).sort({ name: 1 });
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

  async delete(userId: string, id: string) {
    return this.categoryModel.deleteOne({ _id: id, userId: new Types.ObjectId(userId), isDefault: false });
  }
}
