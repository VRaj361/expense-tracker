import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BankProfileDocument = BankProfile & Document;

@Schema({ timestamps: true })
export class BankProfile {
  @Prop({ type: Types.ObjectId, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ required: true })
  bankName: string;

  @Prop({ required: true })
  dateColumn: string;

  @Prop({ required: true })
  descriptionColumn: string;

  @Prop()
  withdrawalColumn: string;

  @Prop()
  depositColumn: string;

  @Prop()
  amountColumn: string;

  @Prop()
  balanceColumn: string;

  @Prop({ default: 'DD-MM-YYYY' })
  dateFormat: string;

  @Prop({ default: 0 })
  headerRowIndex: number;

  @Prop({ default: ',' })
  delimiter: string;

  @Prop({ default: false })
  isGlobal: boolean;

  @Prop()
  notes: string;
}

export const BankProfileSchema = SchemaFactory.createForClass(BankProfile);
