import { IsString, IsNumber, IsOptional, IsBoolean, IsObject, Min } from 'class-validator';

export class UpdateGameDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsObject()
  game_data?: any;

  @IsOptional()
  @IsNumber()
  @Min(1)
  points_per_completion?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  max_attempts_per_user?: number;

  @IsOptional()
  @IsNumber()
  @Min(30)
  time_limit_seconds?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  difficulty_level?: number;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}