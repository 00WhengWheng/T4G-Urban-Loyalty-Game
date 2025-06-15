import { IsString, IsNumber, IsBoolean, IsOptional } from 'class-validator';

export class CreateNfcTagDto {
  @IsString()
  tag_identifier: string;

  @IsOptional()
  @IsString()
  tag_name?: string;

  @IsOptional()
  @IsString()
  location_description?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsNumber()
  max_scans_per_user_per_day?: number;

  @IsOptional()
  @IsNumber()
  points_per_scan?: number;
}