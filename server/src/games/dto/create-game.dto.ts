import { IsString, IsNumber, IsOptional, IsBoolean, IsObject, MinLength, Min } from 'class-validator';

export class CreateGameDto {
  @IsOptional()
  @IsString()
  challenge_id?: string;

  @IsString()
  game_type: string; // quiz, ability, memory

  @IsString()
  @MinLength(3)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsObject()
  game_data: any; // questions, rules, configuration

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