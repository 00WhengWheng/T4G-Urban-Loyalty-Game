import { IsString, IsOptional, IsDateString, IsNumber, IsIn, IsObject, MinLength } from 'class-validator';

export class CreateChallengeDto {
  @IsString()
  @MinLength(3)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  @IsIn(['open', 'close'])
  challenge_type: string;

  @IsOptional()
  @IsString()
  challenge_category?: string; // treasure_hunt, cops_robbers, quiz, mixed

  @IsOptional()
  @IsString()
  localization?: string;

  @IsDateString()
  start_date: string;

  @IsDateString()
  end_date: string;

  @IsOptional()
  @IsNumber()
  max_participants?: number;

  @IsOptional()
  @IsNumber()
  entry_fee_points?: number;

  @IsOptional()
  @IsNumber()
  geofence_radius?: number;

  @IsOptional()
  @IsObject()
  rules?: any;
}