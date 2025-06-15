import { IsString, IsOptional, IsIn } from 'class-validator';

export class CreateShareDto {
  @IsOptional()
  @IsString()
  challenge_id?: string;

  @IsOptional()
  @IsString()
  tenant_id?: string;

  @IsString()
  @IsIn(['instagram', 'facebook', 'tiktok', 'whatsapp'])
  platform: string;

  @IsString()
  @IsIn(['story', 'post', 'tag'])
  share_type: string;

  @IsOptional()
  @IsString()
  share_content?: string;
}