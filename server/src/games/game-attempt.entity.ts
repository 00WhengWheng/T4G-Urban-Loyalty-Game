import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { Game } from './game.entity';
import { Challenge } from '../challenges/challenge.entity';

@Entity('game_attempts')
export class GameAttempt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  user_id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  game_id: string;

  @ManyToOne(() => Game, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'game_id' })
  game: Game;

  @Column({ nullable: true })
  challenge_id: string;

  @ManyToOne(() => Challenge)
  @JoinColumn({ name: 'challenge_id' })
  challenge: Challenge;

  @Column()
  score: number;

  @Column()
  max_score: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  completion_percentage: number;

  @Column({ nullable: true })
  time_taken_seconds: number;

  @Column({ type: 'jsonb', nullable: true })
  attempt_data: any;

  @Column({ default: 0 })
  points_earned: number;

  @CreateDateColumn()
  completed_at: Date;
}