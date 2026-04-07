import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RecurringExpenseDocument = RecurringExpense & Document;

@Schema({ timestamps: true })
export class RecurringExpense {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  amount: number;

  @Prop({ type: Types.ObjectId, ref: 'Category' })
  categoryId: Types.ObjectId;

  @Prop()
  categoryName: string;

  @Prop()
  description: string;

  @Prop({ required: true, enum: ['daily', 'weekly', 'monthly', 'yearly'] })
  frequency: string;

  @Prop({ enum: ['cash', 'upi', 'credit_card', 'debit_card', 'bank_transfer'] })
  paymentMethod: string;

  @Prop()
  vendor: string;

  @Prop({ required: true })
  nextDueDate: Date;

  @Prop()
  lastProcessedDate: Date;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ required: true, enum: ['expense', 'income'], default: 'expense' })
  type: string;
}

export const RecurringExpenseSchema = SchemaFactory.createForClass(RecurringExpense);
