import { IsObject, IsOptional, IsNumber } from 'class-validator';

export class PlayGameDto {
  @IsObject()
  answers: any; // User's answers/responses

  @IsOptional()
  @IsNumber()
  timeTaken?: number; // Seconds taken to complete

  @IsOptional()
  @IsObject()
  metadata?: any; // Additional game-specific data
}