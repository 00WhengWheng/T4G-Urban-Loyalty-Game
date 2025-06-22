import { Controller, Post, Get, Put, Body, UseGuards, Request, Param, Query, ForbiddenException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GamesService } from './games.service';
import { CreateGameDto } from './dto/create-game.dto';
import { UpdateGameDto } from './dto/update-game.dto';
import { PlayGameDto } from './dto/play-game.dto';

@Controller('api/v1/games')
export class GamesController {
  constructor(private gamesService: GamesService) {}

  // PUBLIC ENDPOINTS
  @Get()
  async getAvailableGames() {
    return this.gamesService.getUserGames();
  }

  @Get(':id')
  async getGameById(@Param('id') id: string) {
    return this.gamesService.getGameById(id);
  }

  @Get(':id/leaderboard')
  async getGameLeaderboard(@Param('id') id: string, @Query('limit') limit: number = 50) {
    return this.gamesService.getGameLeaderboard(id, limit);
  }

  // USER ENDPOINTS
  @UseGuards(JwtAuthGuard)
  @Get('user/available')
  async getUserAvailableGames(@Request() req) {
    if (req.user.userType !== 'user') {
      throw new ForbiddenException('Only users can view available games');
    }
    return this.gamesService.getUserGames(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/play')
  async playGame(@Request() req, @Param('id') gameId: string, @Body() playGameDto: PlayGameDto) {
    if (req.user.userType !== 'user') {
      throw new ForbiddenException('Only users can play games');
    }
    return this.gamesService.startGameAttempt(gameId, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('user/my-attempts')
  async getUserAttempts(@Request() req, @Query('gameId') gameId?: string) {
    if (req.user.userType !== 'user') {
      throw new ForbiddenException('Only users can view their attempts');
    }
    return this.gamesService.getUserGameHistory(req.user.id);
  }

  // TENANT ENDPOINTS
  @UseGuards(JwtAuthGuard)
  @Post()
  async createGame(@Request() req, @Body() createGameDto: CreateGameDto) {
    if (req.user.userType !== 'tenant') {
      throw new ForbiddenException('Only tenants can create games');
    }
    return this.gamesService.createGame(req.user.id, createGameDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('tenant/my-games')
  async getTenantGames(@Request() req) {
    if (req.user.userType !== 'tenant') {
      throw new ForbiddenException('Only tenants can view their games');
    }
    return this.gamesService.getTenantGames(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async updateGame(@Request() req, @Param('id') gameId: string, @Body() updateGameDto: UpdateGameDto) {
    if (req.user.userType !== 'tenant') {
      throw new ForbiddenException('Only tenants can update games');
    }
    return this.gamesService.updateGame(gameId, req.user.id, updateGameDto);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id/deactivate')
  async deactivateGame(@Request() req, @Param('id') gameId: string) {
    if (req.user.userType !== 'tenant') {
      throw new ForbiddenException('Only tenants can deactivate games');
    }
    return this.gamesService.deleteGame(gameId, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/stats')
  async getGameStats(@Request() req, @Param('id') gameId: string) {
    if (req.user.userType !== 'tenant') {
      throw new ForbiddenException('Only tenants can view game stats');
    }
    return this.gamesService.getGameStats(gameId, req.user.id);
  }
}