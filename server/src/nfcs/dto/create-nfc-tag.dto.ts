import { IsString, IsNumber, IsBoolean, IsOptional, IsDecimal } from 'class-validator';

export class CreateNfcTagDto {
  @IsString()
  tag_identifier: string;

  @IsOptional()
  @IsString()
  tag_location?: string;

  @IsOptional()
  @IsDecimal()
  latitude?: number;

  @IsOptional()
  @IsDecimal()
  longitude?: number;

  @IsNumber()
  points_per_scan: number;

  @IsNumber()
  max_daily_scans: number;

  @IsNumber()
  max_total_scans: number;

  @IsNumber()
  scan_radius: number; // in meters

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}