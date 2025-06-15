import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ unique: true, length: 50 })
  username: string;

  @Column()
  password_hash: string;

  @Column({ nullable: true, length: 100 })
  first_name?: string;

  @Column({ nullable: true, length: 100 })
  last_name?: string;

  @Column({ nullable: true, length: 500 })
  avatar_url?: string;

  @Column({ nullable: true, length: 20 })
  phone?: string;

  @Column({ type: 'date', nullable: true })
  date_of_birth?: Date;

  @Column({ default: 0 })
  total_points: number;

  @Column({ default: 1 })
  level: number;

  @Column({ default: 'active', length: 20 })
  status: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}