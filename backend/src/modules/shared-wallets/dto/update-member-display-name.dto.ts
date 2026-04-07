import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateMemberDisplayNameDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  displayName?: string;
}
