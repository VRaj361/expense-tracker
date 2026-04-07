import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SharedWalletDocument = SharedWallet & Document;

@Schema({ timestamps: true })
export class SharedWallet {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  ownerId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true })
  description: string;

  @Prop({ default: 'INR' })
  currency: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const SharedWalletSchema = SchemaFactory.createForClass(SharedWallet);
SharedWalletSchema.index({ ownerId: 1, createdAt: -1 });
