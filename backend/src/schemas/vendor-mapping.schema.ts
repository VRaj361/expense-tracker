import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type VendorMappingDocument = VendorMapping & Document;

@Schema({ timestamps: true })
export class VendorMapping {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  vendorPattern: string;

  @Prop({ type: Types.ObjectId, ref: 'Category', required: true })
  categoryId: Types.ObjectId;

  @Prop()
  categoryName: string;
}

export const VendorMappingSchema = SchemaFactory.createForClass(VendorMapping);
VendorMappingSchema.index({ userId: 1, vendorPattern: 1 }, { unique: true });
