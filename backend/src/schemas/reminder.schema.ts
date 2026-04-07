import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ReminderDocument = Reminder & Document;

@Schema({ timestamps: true })
export class Reminder {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop()
  description: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  dueDate: Date;

  @Prop({ required: true, enum: ['once', 'daily', 'weekly', 'monthly', 'yearly'] })
  frequency: string;

  @Prop({ type: [String], default: ['inApp'], enum: ['email', 'whatsapp', 'inApp'] })
  notifyVia: string[];

  @Prop({ default: false })
  isPaid: boolean;

  @Prop({ default: true })
  isActive: boolean;
}

export const ReminderSchema = SchemaFactory.createForClass(Reminder);
