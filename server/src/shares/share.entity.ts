import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { Challenge } from '../challenges/challenge.entity';
import { Tenant } from '../tenants/tenant.entity';

@Entity('shares')
export class Share {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  user_id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ nullable: true })
  challenge_id: string;

  @ManyToOne(() => Challenge)
  @JoinColumn({ name: 'challenge_id' })
  challenge: Challenge;

  @Column({ nullable: true })
  tenant_id: string;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @Column({ length: 20 })
  platform: string; // facebook, instagram, whatsapp, tiktok

  @Column({ length: 30 })
  share_type: string; // story, post, tag

  @Column({ type: 'text', nullable: true })
  share_content: string;

  @Column({ default: 5 })
  points_earned: number;

  @CreateDateColumn()
  shared_at: Date;

  @Column({ default: 'verified', length: 20 })
  verification_status: string; // verified, pending, rejected
}