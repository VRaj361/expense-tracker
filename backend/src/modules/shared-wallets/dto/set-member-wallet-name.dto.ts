import { IsString, MaxLength } from 'class-validator';

/** Body for PATCH .../members/:memberId/name — wallet display label (owner only). Use "" to clear. */
export class SetMemberWalletNameDto {
  @IsString()
  @MaxLength(80)
  displayName: string;
}
