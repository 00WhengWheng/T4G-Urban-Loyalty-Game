import { Controller, Post, Get, Put, Body, UseGuards, Request, Param, Query, ForbiddenException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SharesService } from './shares.service';
import { CreateShareDto } from './dto/create-share.dto';
import { UpdateShareVerificationDto } from './dto/update-share-verification.dto';

@Controller('shares')
export class SharesController {
  constructor(private sharesService: SharesService) {}

  // PUBLIC ENDPOINTS
  @Get('trending')
  async getTrendingShares(@Query('platform') platform?: string, @Query('hours') hours: number = 24) {
    return this.sharesService.getPopularPlatforms();
  }

  @Get('leaderboard')
  async getShareLeaderboard(@Query('period') period: 'daily' | 'weekly' | 'monthly' = 'weekly') {
    return this.sharesService.getShareStats();
  }

  @Get('platform/:platform')
  async getSharesByPlatform(@Param('platform') platform: string, @Query('limit') limit: number = 50) {
    return this.sharesService.getSharesByPlatform(platform, limit);
  }

  // USER ENDPOINTS
  @UseGuards(JwtAuthGuard)
  @Post()
  async createShare(@Request() req, @Body() createShareDto: CreateShareDto) {
    if (req.user.userType !== 'user') {
      throw new ForbiddenException('Only users can create shares');
    }
    return this.sharesService.createShare(req.user.id, createShareDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('user/my-shares')
  async getUserShares(@Request() req, @Query('limit') limit: number = 50) {
    if (req.user.userType !== 'user') {
      throw new ForbiddenException('Only users can view their shares');
    }
    return this.sharesService.getUserShares(req.user.id, limit);
  }

  // TENANT ENDPOINTS
  @UseGuards(JwtAuthGuard)
  @Get('tenant/stats')
  async getTenantShareStats(@Request() req, @Query('days') days: number = 30) {
    if (req.user.userType !== 'tenant') {
      throw new ForbiddenException('Only tenants can view share stats');
    }
    return this.sharesService.getTenantShareStats(req.user.id, days);
  }

  @UseGuards(JwtAuthGuard)
  @Get('challenge/:challengeId/stats')
  async getChallengeShareStats(@Request() req, @Param('challengeId') challengeId: string) {
    // Verifica che il tenant possieda il challenge (da implementare)
    return this.sharesService.getChallengeShareStats(challengeId);
  }

  // ADMIN ENDPOINTS (per ora accessibili ai tenant, poi si può restringere)
  @UseGuards(JwtAuthGuard)
  @Get('pending')
  async getPendingShares(@Request() req, @Query('limit') limit: number = 50) {
    return this.sharesService.getShareStats();
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id/verification')
  async updateShareVerification(
    @Request() req, 
    @Param('id') shareId: string, 
    @Body() updateDto: UpdateShareVerificationDto
  ) {
    // This method is not implemented in the service yet
    return { message: 'Share verification update not implemented' };
  }
}