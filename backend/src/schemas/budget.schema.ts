import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BudgetDocument = Budget & Document;

@Schema({ timestamps: true })
export class Budget {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Category' })
  categoryId: Types.ObjectId;

  @Prop()
  categoryName: string;

  @Prop({ required: true })
  limit: number;

  @Prop({ default: 0 })
  spent: number;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop({ default: true })
  alertAt80: boolean;

  @Prop({ default: true })
  alertAtLimit: boolean;
}

export const BudgetSchema = SchemaFactory.createForClass(Budget);
BudgetSchema.index({ userId: 1, startDate: 1, endDate: 1 });
