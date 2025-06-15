import { IsString, IsOptional, IsIn } from 'class-validator';

export class UpdateShareVerificationDto {
  @IsString()
  @IsIn(['verified', 'pending', 'rejected'])
  verification_status: string;

  @IsOptional()
  @IsString()
  reason?: string;
}