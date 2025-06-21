import { IsString, IsOptional, IsNumber, IsDateString, IsBoolean } from 'class-validator';

export class CreateTokenDto {
  @IsString()
  token_name: string;

  @IsOptional()
  @IsString()
  token_description?: string;

  @IsNumber()
  token_value: number;

  @IsString()
  token_type: string;

  @IsNumber()
  required_points: number;

  @IsNumber()
  quantity_available: number;

  @IsOptional()
  @IsDateString()
  expiry_date?: Date;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
