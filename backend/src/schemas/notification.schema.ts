import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type NotificationDocument = Notification & Document;

@Schema({ timestamps: true })
export class Notification {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  message: string;

  @Prop({ required: true, enum: ['budget_alert', 'bill_reminder', 'emi_reminder', 'report', 'system', 'automation'] })
  type: string;

  @Prop({ default: false })
  isRead: boolean;

  @Prop({ type: Object })
  metadata: Record<string, any>;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
NotificationSchema.index({ userId: 1, createdAt: -1 });
