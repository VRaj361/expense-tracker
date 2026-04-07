import { IsOptional, IsString, IsNumber, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryExpenseDto {
  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minAmount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxAmount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number = 20;

  @IsOptional()
  @IsString()
  sortBy?: string = 'date';

  @IsOptional()
  @IsString()
  sortOrder?: string = 'desc';
}
