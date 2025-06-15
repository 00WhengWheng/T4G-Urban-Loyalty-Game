import { IsString, IsNumber, IsOptional, IsObject } from 'class-validator';

export class CreateNfcScanDto {
  @IsString()
  tag_identifier: string;

  @IsNumber()
  user_latitude: number;

  @IsNumber()
  user_longitude: number;

  @IsOptional()
  @IsObject()
  device_info?: any;

  @IsOptional()
  @IsString()
  ip_address?: string;
}