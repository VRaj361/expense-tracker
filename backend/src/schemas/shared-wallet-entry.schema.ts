import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SharedWalletEntryDocument = SharedWalletEntry & Document;

@Schema({ timestamps: true })
export class SharedWalletEntry {
  @Prop({ type: Types.ObjectId, ref: 'SharedWallet', required: true, index: true })
  walletId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdByUserId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  onBehalfOfUserId: Types.ObjectId;

  @Prop({ required: true, min: 0 })
  amount: number;

  @Prop({ trim: true })
  category: string;

  @Prop({ trim: true })
  description: string;

  @Prop({ required: true })
  spentAt: Date;

  @Prop({ enum: ['expense', 'income'], default: 'expense' })
  type: string;
}

export const SharedWalletEntrySchema = SchemaFactory.createForClass(SharedWalletEntry);
SharedWalletEntrySchema.index({ walletId: 1, spentAt: -1 });
