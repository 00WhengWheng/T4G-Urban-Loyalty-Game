import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateTokenDto } from './dto/create-token.dto';
import { UpdateTokenDto } from './dto/update-token.dto';
import { Token } from './token.entity';

@Injectable()
export class TokensService {
  constructor(
    @InjectRepository(Token)
    private readonly tokenRepository: Repository<Token>,
  ) {}

  async create(createTokenDto: CreateTokenDto): Promise<Token> {
    const newToken = this.tokenRepository.create({
      ...createTokenDto,
      tenant_id: 'default-tenant-id', // Valore predefinito o da configurare dinamicamente
      token_name: 'Default Token Name', // Valore predefinito
      token_description: undefined, // Campo opzionale
    });
    return this.tokenRepository.save(newToken);
  }

  async findAll(): Promise<Token[]> {
    return this.tokenRepository.find();
  }

  async findOne(id: string): Promise<Token> {
    const token = await this.tokenRepository.findOne({ where: { id } });
    if (!token) {
      throw new NotFoundException('Token not found');
    }
    return token;
  }

  async update(id: string, updateTokenDto: UpdateTokenDto): Promise<Token> {
    const token = await this.findOne(id);
    Object.assign(token, updateTokenDto);
    return this.tokenRepository.save(token);
  }

  async remove(id: string): Promise<void> {
    const token = await this.findOne(id);
    await this.tokenRepository.remove(token);
  }

  async getAvailableTokens(): Promise<Token[]> {
    return this.tokenRepository.find({ where: { is_active: true }, order: { created_at: 'DESC' } });
  }

  async deactivateToken(id: string): Promise<Token> {
    const token = await this.findOne(id);
    token.is_active = false;
    return this.tokenRepository.save(token);
  }

  // Additional methods for claims and tenant-specific logic can be added here.
}
