import { Injectable } from '@nestjs/common';
import { CreateTokenDto } from './dto/create-token.dto';
import { UpdateTokenDto } from './dto/update-token.dto';
import { Token } from './token.entity';

@Injectable()
export class TokensService {
  private tokens: Token[] = [];

  create(createTokenDto: CreateTokenDto): Token {
    const newToken: Token = {
      id: (Date.now()).toString(),
      ...createTokenDto,
      created_at: new Date(),
      updated_at: new Date(),
    };
    this.tokens.push(newToken);
    return newToken;
  }

  findAll(): Token[] {
    return this.tokens;
  }

  findOne(id: string): Token | undefined {
    return this.tokens.find(token => token.id === id);
  }

  update(id: string, updateTokenDto: UpdateTokenDto): Token | null {
    const tokenIndex = this.tokens.findIndex(token => token.id === id);
    if (tokenIndex === -1) return null;
    this.tokens[tokenIndex] = {
      ...this.tokens[tokenIndex],
      ...updateTokenDto,
      updated_at: new Date(),
    };
    return this.tokens[tokenIndex];
  }

  remove(id: string): Token | null {
    const tokenIndex = this.tokens.findIndex(token => token.id === id);
    if (tokenIndex === -1) return null;
    return this.tokens.splice(tokenIndex, 1)[0];
  }
}
