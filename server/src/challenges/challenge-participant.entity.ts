import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { Challenge } from './challenge.entity';
import { User } from '../users/user.entity';

@Entity('challenge_participants')
@Unique(['challenge_id', 'user_id'])
export class ChallengeParticipant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  challenge_id: string;

  @ManyToOne(() => Challenge, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'challenge_id' })
  challenge: Challenge;

  @Column()
  user_id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @CreateDateColumn()
  joined_at: Date;

  @Column({ default: 0 })
  current_score: number;

  @Column({ default: 'active', length: 20 })
  completion_status: string; // active, completed, abandoned

  @Column({ nullable: true })
  final_ranking: number;
}