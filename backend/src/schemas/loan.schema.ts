import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type LoanDocument = Loan & Document;

@Schema({ timestamps: true })
export class Loan {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  loanAmount: number;

  @Prop({ required: true })
  interestRate: number;

  @Prop({ required: true })
  emiAmount: number;

  @Prop({ required: true })
  tenure: number;

  @Prop({ default: 0 })
  paidEmis: number;

  @Prop()
  remainingBalance: number;

  @Prop({ default: 0 })
  extraPaid: number;

  @Prop({ required: true })
  startDate: Date;

  @Prop()
  nextEmiDate: Date;

  @Prop({ default: 5 })
  emiDay: number;

  @Prop({ default: false })
  autoDeduct: boolean;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ enum: ['home', 'car', 'personal', 'education', 'credit_card', 'other'], default: 'other' })
  loanType: string;

  @Prop([raw({
    date: { type: Date },
    amount: { type: Number },
    type: { type: String },
    note: { type: String },
  })])
  payments: Record<string, any>[];
}

export const LoanSchema = SchemaFactory.createForClass(Loan);
