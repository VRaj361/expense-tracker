import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AppMigrationDocument = AppMigration & Document;

@Schema({ collection: 'app_migrations', timestamps: true })
export class AppMigration {
  @Prop({ required: true, unique: true })
  key: string;
}

export const AppMigrationSchema = SchemaFactory.createForClass(AppMigration);
