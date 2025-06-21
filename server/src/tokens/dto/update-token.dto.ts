import { PartialType } from '@nestjs/mapped-types';
import { CreateTokenDto } from './create-token.dto';
import { IsOptional, IsBoolean } from 'class-validator';

export class UpdateTokenDto extends PartialType(CreateTokenDto) {
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
