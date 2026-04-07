import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SharedWalletSettlementDocument = SharedWalletSettlement & Document;

@Schema({ timestamps: true })
export class SharedWalletSettlement {
  @Prop({ type: Types.ObjectId, ref: 'SharedWallet', required: true, index: true })
  walletId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  fromUserId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  toUserId: Types.ObjectId;

  @Prop({ required: true, min: 0 })
  amount: number;

  @Prop({ trim: true })
  note: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  recordedByUserId: Types.ObjectId;
}

export const SharedWalletSettlementSchema = SchemaFactory.createForClass(SharedWalletSettlement);
SharedWalletSettlementSchema.index({ walletId: 1, createdAt: -1 });
