import { ArrayMinSize, ArrayUnique, IsArray, IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateChatDto {
  @IsIn(['personal', 'group'])
  type!: 'personal' | 'group';

  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  members!: string[];

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  avatar?: string;
}

export class UpdateChatDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  avatar?: string;
}

export class AddMembersDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  members!: string[];
}

export class RemoveMemberDto {
  @IsString()
  @IsNotEmpty()
  memberId!: string;
}

export class PromoteAdminDto {
  @IsString()
  @IsNotEmpty()
  memberId!: string;
}

export class DemoteAdminDto {
  @IsString()
  @IsNotEmpty()
  memberId!: string;
}
