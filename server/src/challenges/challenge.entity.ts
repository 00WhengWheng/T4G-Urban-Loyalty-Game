import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Tenant } from '../tenants/tenant.entity';

@Entity('challenges')
export class Challenge {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenant_owner_id: string;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_owner_id' })
  tenant_owner: Tenant;

  @Column({ length: 200 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ length: 20 })
  challenge_type: string; // open, close

  @Column({ nullable: true, length: 50 })
  challenge_category: string; // treasure_hunt, cops_robbers, quiz, mixed

  @Column({ nullable: true, length: 200 })
  localization: string;

  @Column({ type: 'timestamp' })
  start_date: Date;

  @Column({ type: 'timestamp' })
  end_date: Date;

  @Column({ nullable: true })
  max_participants: number;

  @Column({ default: 0 })
  entry_fee_points: number;

  @Column({ default: 1000 })
  geofence_radius: number;

  @Column({ type: 'jsonb', nullable: true })
  rules: any;

  @Column({ default: 'draft', length: 20 })
  status: string; // draft, active, completed, cancelled

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}