import { IsEmail, IsString, IsOptional, IsNumber, MinLength, MaxLength, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateTenantDto {
  @ApiProperty({
    description: 'Business name',
    example: 'My Restaurant',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  business_name: string;

  @ApiProperty({
    description: 'Business email address',
    example: 'business@example.com',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;

  @ApiProperty({
    description: 'Business password (for registration)',
    example: 'SecurePassword123!',
    minLength: 8,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  @ApiProperty({
    description: 'Hashed password (internal use)',
    required: false,
  })
  @IsOptional()
  @IsString()
  password_hash?: string;

  @ApiProperty({
    description: 'Business latitude coordinates',
    example: 41.9028,
  })
  @IsNumber()
  latitude: number;

  @ApiProperty({
    description: 'Business longitude coordinates',
    example: 12.4964,
  })
  @IsNumber()
  longitude: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  owner_name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  postal_code?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  business_type?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUrl()
  website?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  instagram?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  facebook?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  logo_url?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  status?: string;
}