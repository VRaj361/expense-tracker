import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type InvestmentDocument = Investment & Document;

@Schema({ timestamps: true })
export class Investment {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, enum: ['stocks', 'mutual_funds', 'crypto', 'fixed_deposit', 'other'] })
  type: string;

  @Prop({ required: true })
  investedAmount: number;

  @Prop({ required: true })
  currentValue: number;

  @Prop()
  units: number;

  @Prop()
  purchaseDate: Date;

  @Prop()
  notes: string;
}

export const InvestmentSchema = SchemaFactory.createForClass(Investment);
