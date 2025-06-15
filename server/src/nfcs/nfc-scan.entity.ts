import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { NfcTag } from './nfc-tag.entity';
import { Tenant } from '../tenants/tenant.entity';

@Entity('nfc_scans')
export class NfcScan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  user_id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  nfc_tag_id: string;

  @ManyToOne(() => NfcTag, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'nfc_tag_id' })
  nfc_tag: NfcTag;

  @Column()
  tenant_id: string;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @Column()
  points_earned: number;

  @CreateDateColumn()
  scan_timestamp: Date;

  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  user_latitude: number;

  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  user_longitude: number;

  @Column({ default: true })
  is_valid: boolean;

  @Column({ type: 'jsonb', nullable: true })
  device_info: any;

  @Column({ type: 'inet', nullable: true })
  ip_address: string;
}