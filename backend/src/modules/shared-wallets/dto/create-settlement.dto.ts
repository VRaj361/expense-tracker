import { IsMongoId, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateSettlementDto {
  @IsMongoId()
  fromUserId: string;

  @IsMongoId()
  toUserId: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  note?: string;
}
