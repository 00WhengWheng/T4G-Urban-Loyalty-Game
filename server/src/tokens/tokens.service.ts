import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { CreateTokenDto } from './dto/create-token.dto';
import { UpdateTokenDto } from './dto/update-token.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TokensService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async create(tenantId: string, createTokenDto: CreateTokenDto) {
    return this.prisma.token.create({
      data: {
        tenantId,
        tokenName: createTokenDto.token_name,
        tokenDescription: createTokenDto.token_description,
        tokenValue: createTokenDto.token_value,
        tokenType: createTokenDto.token_type,
        requiredPoints: createTokenDto.required_points,
        quantityAvailable: createTokenDto.quantity_available,
        expiryDate: createTokenDto.expiry_date,
      },
      include: {
        tenant: {
          select: {
            id: true,
            businessName: true,
            city: true,
          }
        }
      }
    });
  }

  async findAll() {
    return this.prisma.token.findMany({
      include: {
        tenant: {
          select: {
            id: true,
            businessName: true,
            city: true,
          }
        },
        _count: {
          select: {
            tokenClaims: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const token = await this.prisma.token.findUnique({
      where: { id },
      include: {
        tenant: {
          select: {
            id: true,
            businessName: true,
            city: true,
            logoUrl: true,
          }
        },
        tokenClaims: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
              }
            }
          }
        }
      }
    });

    if (!token) {
      throw new NotFoundException('Token not found');
    }

    return token;
  }

  async findByTenant(tenantId: string) {
    return this.prisma.token.findMany({
      where: { tenantId },
      include: {
        _count: {
          select: {
            tokenClaims: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, tenantId: string, updateTokenDto: UpdateTokenDto) {
    // Verify token belongs to tenant
    const token = await this.prisma.token.findFirst({
      where: { id, tenantId }
    });

    if (!token) {
      throw new NotFoundException('Token not found or does not belong to tenant');
    }

    return this.prisma.token.update({
      where: { id },
      data: {
        tokenName: updateTokenDto.token_name,
        tokenDescription: updateTokenDto.token_description,
        tokenValue: updateTokenDto.token_value,
        tokenType: updateTokenDto.token_type,
        requiredPoints: updateTokenDto.required_points,
        quantityAvailable: updateTokenDto.quantity_available,
        expiryDate: updateTokenDto.expiry_date,
        isActive: updateTokenDto.is_active,
      },
      include: {
        tenant: {
          select: {
            id: true,
            businessName: true,
            city: true,
          }
        }
      }
    });
  }

  async remove(id: string, tenantId: string) {
    // Verify token belongs to tenant
    const token = await this.prisma.token.findFirst({
      where: { id, tenantId }
    });

    if (!token) {
      throw new NotFoundException('Token not found or does not belong to tenant');
    }

    // Check if token has been claimed
    const claimsCount = await this.prisma.tokenClaim.count({
      where: { tokenId: id }
    });

    if (claimsCount > 0) {
      throw new BadRequestException('Cannot delete token that has been claimed');
    }

    return this.prisma.token.delete({
      where: { id }
    });
  }

  async getAvailableTokens(userId?: string) {
    const tokens = await this.prisma.token.findMany({
      where: {
        isActive: true,
        OR: [
          { expiryDate: null },
          { expiryDate: { gt: new Date() } }
        ]
      },
      include: {
        tenant: {
          select: {
            id: true,
            businessName: true,
            city: true,
            logoUrl: true,
          }
        },
        tokenClaims: userId ? {
          where: { userId },
          select: { id: true, status: true, claimedAt: true }
        } : false
      },
      orderBy: { createdAt: 'desc' },
    });

    // Filter only tokens that have available quantity and calculate availability
    const availableTokens = tokens.filter(token => token.quantityClaimed < token.quantityAvailable);

    // Calculate availability and add user claim status
    return availableTokens.map(token => ({
      ...token,
      isAvailable: token.quantityClaimed < token.quantityAvailable,
      availabilityPercentage: Math.round((token.quantityAvailable - token.quantityClaimed) / token.quantityAvailable * 100),
      userHasClaimed: userId ? token.tokenClaims && token.tokenClaims.length > 0 : false,
      userClaimStatus: userId && token.tokenClaims && token.tokenClaims.length > 0 ? token.tokenClaims[0].status : null
    }));
  }

  async deactivateToken(id: string, tenantId: string) {
    const token = await this.prisma.token.findFirst({
      where: { id, tenantId }
    });

    if (!token) {
      throw new NotFoundException('Token not found or does not belong to tenant');
    }

    return this.prisma.token.update({
      where: { id },
      data: { isActive: false }
    });
  }

  async activateToken(id: string, tenantId: string) {
    const token = await this.prisma.token.findFirst({
      where: { id, tenantId }
    });

    if (!token) {
      throw new NotFoundException('Token not found or does not belong to tenant');
    }

    return this.prisma.token.update({
      where: { id },
      data: { isActive: true }
    });
  }

  // Token Claim Methods
  async claimToken(tokenId: string, userId: string) {
    // Check if token exists and is available
    const token = await this.prisma.token.findUnique({
      where: { id: tokenId },
      include: {
        tokenClaims: {
          where: { userId }
        }
      }
    });

    if (!token) {
      throw new NotFoundException('Token not found');
    }

    if (!token.isActive) {
      throw new BadRequestException('Token is not active');
    }

    if (token.expiryDate && token.expiryDate < new Date()) {
      throw new BadRequestException('Token has expired');
    }

    if (token.quantityClaimed >= token.quantityAvailable) {
      throw new BadRequestException('Token is no longer available');
    }

    // Check if user already claimed this token
    if (token.tokenClaims.length > 0) {
      throw new BadRequestException('You have already claimed this token');
    }

    // Check if user has enough points
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { totalPoints: true }
    });

    if (!user || user.totalPoints < token.requiredPoints) {
      throw new BadRequestException('Insufficient points to claim this token');
    }

    // Generate unique claim code
    const claimCode = this.generateClaimCode();

    // Perform the claim in a transaction
    return this.prisma.$transaction(async (tx) => {
      // Create the claim
      const claim = await tx.tokenClaim.create({
        data: {
          tokenId,
          userId,
          claimCode,
          status: 'claimed'
        },
        include: {
          token: {
            include: {
              tenant: {
                select: {
                  id: true,
                  businessName: true,
                  city: true,
                  address: true,
                }
              }
            }
          }
        }
      });

      // Update token claimed quantity
      await tx.token.update({
        where: { id: tokenId },
        data: {
          quantityClaimed: {
            increment: 1
          }
        }
      });

      // Deduct points from user
      await tx.user.update({
        where: { id: userId },
        data: {
          totalPoints: {
            decrement: token.requiredPoints
          }
        }
      });

      return claim;
    });
  }

  async getUserTokenClaims(userId: string) {
    return this.prisma.tokenClaim.findMany({
      where: { userId },
      include: {
        token: {
          include: {
            tenant: {
              select: {
                id: true,
                businessName: true,
                city: true,
                address: true,
                logoUrl: true,
              }
            }
          }
        }
      },
      orderBy: { claimedAt: 'desc' }
    });
  }

  async redeemToken(claimCode: string, tenantId?: string) {
    const claim = await this.prisma.tokenClaim.findUnique({
      where: { claimCode },
      include: {
        token: {
          include: {
            tenant: true
          }
        },
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          }
        }
      }
    });

    if (!claim) {
      throw new NotFoundException('Invalid claim code');
    }

    if (claim.status === 'redeemed') {
      throw new BadRequestException('Token has already been redeemed');
    }

    // If tenantId provided, verify token belongs to tenant
    if (tenantId && claim.token.tenantId !== tenantId) {
      throw new ForbiddenException('This token does not belong to your business');
    }

    return this.prisma.tokenClaim.update({
      where: { id: claim.id },
      data: {
        status: 'redeemed',
        redeemedAt: new Date()
      },
      include: {
        token: {
          include: {
            tenant: true
          }
        },
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          }
        }
      }
    });
  }

  async getTokenStats(tokenId: string, tenantId: string) {
    const token = await this.prisma.token.findFirst({
      where: { id: tokenId, tenantId },
      include: {
        _count: {
          select: {
            tokenClaims: true
          }
        }
      }
    });

    if (!token) {
      throw new NotFoundException('Token not found');
    }

    const claimedCount = await this.prisma.tokenClaim.count({
      where: { tokenId, status: 'claimed' }
    });

    const redeemedCount = await this.prisma.tokenClaim.count({
      where: { tokenId, status: 'redeemed' }
    });

    return {
      token,
      stats: {
        totalClaims: token._count.tokenClaims,
        claimedCount,
        redeemedCount,
        availableCount: token.quantityAvailable - token.quantityClaimed,
        claimRate: token.quantityAvailable > 0 ? (token.quantityClaimed / token.quantityAvailable) * 100 : 0,
        redemptionRate: claimedCount > 0 ? (redeemedCount / claimedCount) * 100 : 0,
      }
    };
  }

  async getTenantTokenStats(tenantId: string) {
    const tokens = await this.prisma.token.findMany({
      where: { tenantId },
      include: {
        _count: {
          select: {
            tokenClaims: true
          }
        }
      }
    });

    const totalTokens = tokens.length;
    const activeTokens = tokens.filter(t => t.isActive).length;
    const totalClaims = tokens.reduce((sum, t) => sum + t._count.tokenClaims, 0);
    const totalValue = tokens.reduce((sum, t) => sum + Number(t.tokenValue) * t.quantityClaimed, 0);

    return {
      totalTokens,
      activeTokens,
      totalClaims,
      totalValue,
      tokens: tokens.map(token => ({
        ...token,
        claimRate: token.quantityAvailable > 0 ? (token.quantityClaimed / token.quantityAvailable) * 100 : 0,
      }))
    };
  }

  private generateClaimCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  async validateTokenAvailability(tokenId: string): Promise<boolean> {
    const token = await this.prisma.token.findUnique({
      where: { id: tokenId },
      select: {
        isActive: true,
        quantityAvailable: true,
        quantityClaimed: true,
        expiryDate: true,
      }
    });

    if (!token) return false;
    if (!token.isActive) return false;
    if (token.quantityClaimed >= token.quantityAvailable) return false;
    if (token.expiryDate && token.expiryDate < new Date()) return false;

    return true;
  }

  async getPopularTokens(limit: number = 10) {
    return this.prisma.token.findMany({
      where: {
        isActive: true,
        quantityClaimed: {
          gt: 0
        }
      },
      include: {
        tenant: {
          select: {
            id: true,
            businessName: true,
            city: true,
            logoUrl: true,
          }
        },
        _count: {
          select: {
            tokenClaims: true
          }
        }
      },
      orderBy: {
        quantityClaimed: 'desc'
      },
      take: limit
    });
  }
}
