import { Controller, Post, Get, Put, Delete, Body, UseGuards, Request, Param, Query, ForbiddenException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NfcService } from './nfcs.service';
import { CreateNfcScanDto } from './dto/create-nfc-scan.dto';
import { CreateNfcTagDto } from './dto/create-nfc-tag.dto';

@Controller('nfc')
export class NfcController {
  constructor(private nfcService: NfcService) {}

  // USER ENDPOINTS
  @UseGuards(JwtAuthGuard)
  @Post('scan')
  async scanTag(@Request() req, @Body() createScanDto: CreateNfcScanDto) {
    if (req.user.userType !== 'user') {
      throw new ForbiddenException('Only users can scan NFC tags');
    }
    return this.nfcService.scanNFCTag(req.user.id, createScanDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('scan-history')
  async getScanHistory(@Request() req, @Query('limit') limit: number = 50) {
    if (req.user.userType !== 'user') {
      throw new ForbiddenException('Only users can view scan history');
    }
    return this.nfcService.getUserScanHistory(req.user.id, limit);
  }

  @Get('popular')
  async getPopularTags(@Query('limit') limit: number = 10) {
    return this.nfcService.getPopularNFCTags(limit);
  }

  // TENANT ENDPOINTS
  @UseGuards(JwtAuthGuard)
  @Post('tags')
  async createTag(@Request() req, @Body() createTagDto: CreateNfcTagDto) {
    if (req.user.userType !== 'tenant') {
      throw new ForbiddenException('Only tenants can create NFC tags');
    }
    return this.nfcService.createNFCTag(req.user.id, createTagDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('tags')
  async getTenantTags(
    @Request() req, 
    @Query('page') page: number = 1, 
    @Query('limit') limit: number = 20
  ) {
    if (req.user.userType !== 'tenant') {
      throw new ForbiddenException('Only tenants can view their tags');
    }
    return this.nfcService.getTenantNFCTags(req.user.id, page, limit);
  }

  @UseGuards(JwtAuthGuard)
  @Put('tags/:tagId')
  async updateTag(
    @Request() req, 
    @Param('tagId') tagId: string, 
    @Body() updateTagDto: Partial<CreateNfcTagDto>
  ) {
    if (req.user.userType !== 'tenant') {
      throw new ForbiddenException('Only tenants can update their tags');
    }
    return this.nfcService.updateNFCTag(tagId, req.user.id, updateTagDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('tags/:tagId')
  async deleteTag(@Request() req, @Param('tagId') tagId: string) {
    if (req.user.userType !== 'tenant') {
      throw new ForbiddenException('Only tenants can delete their tags');
    }
    return this.nfcService.deleteNFCTag(tagId, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('tags/:tagId/stats')
  async getTagStats(@Request() req, @Param('tagId') tagId: string) {
    if (req.user.userType !== 'tenant') {
      throw new ForbiddenException('Only tenants can view tag stats');
    }
    return this.nfcService.getNFCTagStats(tagId, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('stats')
  async getTenantStats(@Request() req) {
    if (req.user.userType !== 'tenant') {
      throw new ForbiddenException('Only tenants can view NFC stats');
    }
    return this.nfcService.getTenantNFCStats(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('scan-stats')
  async getScanStats(@Request() req, @Query('days') days: number = 30) {
    if (req.user.userType !== 'tenant') {
      throw new ForbiddenException('Only tenants can view scan stats');
    }
    return this.nfcService.getTenantNFCStats(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('tags/:tagId/scan-count')
  async getTagScanCount(@Request() req, @Param('tagId') tagId: string) {
    if (req.user.userType !== 'tenant') {
      throw new ForbiddenException('Only tenants can view tag scan counts');
    }
    return this.nfcService.getNFCTagStats(tagId, req.user.id);
  }
}