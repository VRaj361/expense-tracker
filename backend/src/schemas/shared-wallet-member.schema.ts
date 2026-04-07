import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SharedWalletMemberDocument = SharedWalletMember & Document;

@Schema({ timestamps: true })
export class SharedWalletMember {
  @Prop({ type: Types.ObjectId, ref: 'SharedWallet', required: true, index: true })
  walletId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true, enum: ['owner', 'editor', 'viewer'] })
  role: string;

  @Prop({ required: true, enum: ['pending', 'active', 'removed'], default: 'pending' })
  status: string;

  @Prop({ trim: true })
  inviteTokenHash: string;

  @Prop()
  inviteExpiresAt: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  invitedBy: Types.ObjectId;

  /** Optional name shown only in this wallet (owner can edit). Falls back to FinTrack profile name. */
  @Prop({ trim: true })
  displayName?: string;
}

export const SharedWalletMemberSchema = SchemaFactory.createForClass(SharedWalletMember);
SharedWalletMemberSchema.index({ walletId: 1, email: 1 });
SharedWalletMemberSchema.index({ inviteTokenHash: 1 }, { sparse: true });
