import { Controller, Post, Get, Put, Body, UseGuards, Request, Param, Query, ForbiddenException, ParseIntPipe, ParseUUIDPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ChallengesService } from './challenges.service';
import { CreateChallengeDto } from './dto/create-challenge.dto';

@Controller('challenges')
export class ChallengesController {
  constructor(private challengesService: ChallengesService) {}

  // Helper method to check user type
  private checkUserType(userType: string, requiredType: string): void {
    if (userType !== requiredType) {
      throw new ForbiddenException(`Only ${requiredType}s can perform this action`);
    }
  }

  // PUBLIC ENDPOINTS
  @Get()
  async getAllChallenges() {
    return this.challengesService.findAll();
  }

  @Get(':id')
  async getChallengeById(@Param('id', ParseUUIDPipe) id: string) {
    return this.challengesService.findById(id);
  }

  @Get(':id/leaderboard')
  async getChallengeLeaderboard(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('limit', ParseIntPipe) limit: number = 50,
  ) {
    return this.challengesService.getChallengeLeaderboard(id, limit);
  }

  // USER ENDPOINTS
  @UseGuards(JwtAuthGuard)
  @Post(':id/join')
  async joinChallenge(@Request() req, @Param('id', ParseUUIDPipe) id: string) {
    this.checkUserType(req.user.userType, 'user');
    return this.challengesService.joinChallenge(id, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/leave')
  async leaveChallenge(@Request() req, @Param('id', ParseUUIDPipe) id: string) {
    this.checkUserType(req.user.userType, 'user');
    return this.challengesService.leaveChallenge(id, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('user/my-challenges')
  async getUserChallenges(@Request() req) {
    this.checkUserType(req.user.userType, 'user');
    return this.challengesService.getUserChallenges(req.user.id);
  }

  // TENANT ENDPOINTS
  @UseGuards(JwtAuthGuard)
  @Post()
  async createChallenge(@Request() req, @Body() createChallengeDto: CreateChallengeDto) {
    this.checkUserType(req.user.userType, 'tenant');
    return this.challengesService.create(req.user.id, createChallengeDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('tenant/my-challenges')
  async getTenantChallenges(@Request() req) {
    this.checkUserType(req.user.userType, 'tenant');
    return this.challengesService.findByTenant(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id/status')
  async updateChallengeStatus(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: string,
  ) {
    this.checkUserType(req.user.userType, 'tenant');
    return this.challengesService.updateStatus(id, req.user.id, status);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/complete')
  async completeChallenge(@Request() req, @Param('id', ParseUUIDPipe) id: string) {
    this.checkUserType(req.user.userType, 'tenant');
    return this.challengesService.completeChallenge(id, req.user.id);
  }
}