import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ExpenseDocument = Expense & Document;

@Schema({ timestamps: true })
export class Expense {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true, enum: ['expense', 'income'] })
  type: string;

  @Prop({ type: Types.ObjectId, ref: 'Category' })
  categoryId: Types.ObjectId;

  @Prop()
  categoryName: string;

  @Prop({ required: true })
  date: Date;

  @Prop()
  description: string;

  @Prop({ enum: ['cash', 'upi', 'credit_card', 'debit_card', 'bank_transfer'] })
  paymentMethod: string;

  @Prop()
  vendor: string;

  @Prop()
  receiptUrl: string;

  @Prop({ default: false })
  isRecurring: boolean;

  @Prop({ type: Types.ObjectId, ref: 'RecurringExpense' })
  recurringExpenseId: Types.ObjectId;

  @Prop({ type: [String], default: [] })
  tags: string[];
}

export const ExpenseSchema = SchemaFactory.createForClass(Expense);
ExpenseSchema.index({ userId: 1, date: -1 });
ExpenseSchema.index({ userId: 1, type: 1 });
ExpenseSchema.index({ userId: 1, categoryId: 1 });
