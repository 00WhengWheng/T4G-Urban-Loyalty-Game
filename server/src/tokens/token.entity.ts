import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Tenant } from '../tenants/tenant.entity';

@Entity('tokens')
export class Token {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenant_id: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @Column({ length: 200 })
  token_name: string;

  @Column({ type: 'text', nullable: true })
  token_description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  token_value: number;

  @Column({ length: 50 })
  token_type: string; // drink, pizza, discount, product

  @Column()
  required_points: number;

  @Column()
  quantity_available: number;

  @Column({ default: 0 })
  quantity_claimed: number;

  @Column({ type: 'timestamp', nullable: true })
  expiry_date: Date;

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}