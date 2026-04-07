import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AutomationRuleDocument = AutomationRule & Document;

@Schema({ timestamps: true })
export class AutomationRule {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, type: Object })
  condition: {
    field: string;
    operator: string;
    value: any;
  };

  @Prop({ required: true, type: Object })
  action: {
    type: string;
    value: any;
  };

  @Prop({ default: true })
  isActive: boolean;
}

export const AutomationRuleSchema = SchemaFactory.createForClass(AutomationRule);
