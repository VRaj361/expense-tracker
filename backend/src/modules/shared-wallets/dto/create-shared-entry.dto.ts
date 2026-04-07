import { IsDateString, IsIn, IsMongoId, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateSharedEntryDto {
  @IsNumber()
  @Min(0)
  amount: number;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  category?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsDateString()
  spentAt: string;

  @IsOptional()
  @IsString()
  @IsIn(['expense', 'income'])
  type?: 'expense' | 'income';

  /** Owner only: attribute expense to another active member */
  @IsOptional()
  @IsMongoId()
  onBehalfOfUserId?: string;
}
