import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  googleId: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  avatar: string;

  @Prop()
  phone: string;

  @Prop({ default: 'INR' })
  currency: string;

  @Prop()
  refreshToken: string;

  @Prop({ type: Object, default: { email: true, whatsapp: false, inApp: true } })
  notificationPreferences: {
    email: boolean;
    whatsapp: boolean;
    inApp: boolean;
  };
}

export const UserSchema = SchemaFactory.createForClass(User);
