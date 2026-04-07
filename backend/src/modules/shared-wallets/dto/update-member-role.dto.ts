import { IsIn, IsString } from 'class-validator';

export class UpdateMemberRoleDto {
  @IsString()
  @IsIn(['editor', 'viewer'])
  role: 'editor' | 'viewer';
}
