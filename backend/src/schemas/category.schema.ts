import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CategoryDocument = Category & Document;

@Schema({ timestamps: true })
export class Category {
  @Prop({ type: Types.ObjectId, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ default: 'other' })
  icon: string;

  @Prop({ default: '#6366f1' })
  color: string;

  @Prop({ required: true, enum: ['expense', 'income', 'both'], default: 'expense' })
  type: string;

  @Prop({ default: false })
  isDefault: boolean;
}

export const CategorySchema = SchemaFactory.createForClass(Category);
