import { IsString, IsNumber, IsOptional, IsObject } from 'class-validator';

export class CreateNfcScanDto {
  @IsString()
  tag_identifier: string;

  @IsOptional()
  @IsNumber()
  user_latitude?: number;

  @IsOptional()
  @IsNumber()
  user_longitude?: number;

  @IsOptional()
  @IsObject()
  scan_location?: {
    latitude?: number;
    longitude?: number;
    accuracy?: number;
    timestamp?: string;
  };

  @IsOptional()
  @IsObject()
  device_info?: {
    userAgent?: string;
    platform?: string;
    appVersion?: string;
  };
}