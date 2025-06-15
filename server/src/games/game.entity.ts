import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Tenant } from '../tenants/tenant.entity';
import { Challenge } from '../challenges/challenge.entity';

@Entity('games')
export class Game {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  tenant_id: string;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @Column({ nullable: true })
  challenge_id: string;

  @ManyToOne(() => Challenge)
  @JoinColumn({ name: 'challenge_id' })
  challenge: Challenge;

  @Column({ length: 50 })
  game_type: string; // quiz, ability, memory, etc

  @Column({ length: 200 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'jsonb' })
  game_data: any; // domande, regole, configurazione specifica

  @Column({ default: 50 })
  points_per_completion: number;

  @Column({ default: 3 })
  max_attempts_per_user: number;

  @Column({ default: 300 })
  time_limit_seconds: number;

  @Column({ default: 1 })
  difficulty_level: number;

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;
}