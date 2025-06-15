import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { Token } from './token.entity';
import { Tenant } from '../tenants/tenant.entity';
import { Challenge } from '../challenges/challenge.entity';

@Entity('token_claims')
export class TokenClaim {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  user_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  token_id: string;

  @ManyToOne(() => Token)
  @JoinColumn({ name: 'token_id' })
  token: Token;

  @Column()
  tenant_id: string;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @Column({ nullable: true })
  challenge_id: string;

  @ManyToOne(() => Challenge)
  @JoinColumn({ name: 'challenge_id' })
  challenge: Challenge;

  @Column({ unique: true, length: 20 })
  claim_code: string;

  @Column()
  points_spent: number;

  @CreateDateColumn()
  claimed_at: Date;

  @Column({ nullable: true })
  redeemed_at: Date;

  @Column({ nullable: true })
  redeemed_by_tenant_id: string;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'redeemed_by_tenant_id' })
  redeemed_by_tenant: Tenant;

  @Column({ default: 'claimed', length: 20 })
  status: string; // claimed, redeemed, expired

  @Column({ type: 'timestamp' })
  expires_at: Date;
}