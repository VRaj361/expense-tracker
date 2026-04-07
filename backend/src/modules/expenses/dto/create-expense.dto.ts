import { IsString, IsNumber, IsOptional, IsDateString, IsEnum, IsArray, ValidateIf } from 'class-validator';

export class CreateExpenseDto {
  @IsNumber()
  amount: number;

  @IsEnum(['expense', 'income'])
  type: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  categoryName?: string;

  @IsDateString()
  date: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @ValidateIf((o) => o.paymentMethod !== '')
  @IsEnum(['cash', 'upi', 'credit_card', 'debit_card', 'bank_transfer'])
  paymentMethod?: string;

  @IsOptional()
  @IsString()
  vendor?: string;

  @IsOptional()
  @IsString()
  receiptUrl?: string;

  @IsOptional()
  @IsArray()
  tags?: string[];
}
