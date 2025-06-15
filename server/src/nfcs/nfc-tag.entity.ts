import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Tenant } from '../tenants/tenant.entity';

@Entity('nfc_tags')
export class NfcTag {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenant_id: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @Column({ unique: true, length: 100 })
  tag_identifier: string;

  @Column({ nullable: true, length: 100 })
  tag_name: string;

  @Column({ nullable: true, length: 200 })
  location_description: string;

  @Column({ default: true })
  is_active: boolean;

  @Column({ default: 5 })
  max_scans_per_user_per_day: number;

  @Column({ default: 10 })
  points_per_scan: number;

  @CreateDateColumn()
  created_at: Date;
}