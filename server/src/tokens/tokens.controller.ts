import { Controller, Get, Post, Body, Param, Delete, Put, Query } from '@nestjs/common';
import { TokensService } from './tokens.service';
import { CreateTokenDto } from './dto/create-token.dto';
import { UpdateTokenDto } from './dto/update-token.dto';

@Controller('api/v1/tokens')
export class TokensController {
  constructor(private readonly tokensService: TokensService) {}

  @Post()
  create(@Body() createTokenDto: CreateTokenDto, @Query('tenantId') tenantId: string) {
    return this.tokensService.create(tenantId, createTokenDto);
  }

  @Get()
  findAll() {
    return this.tokensService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tokensService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateTokenDto: UpdateTokenDto, @Query('tenantId') tenantId: string) {
    return this.tokensService.update(id, tenantId, updateTokenDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Query('tenantId') tenantId: string) {
    return this.tokensService.remove(id, tenantId);
  }
}
