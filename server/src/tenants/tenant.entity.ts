import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('tenants')
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 200 })
  business_name: string;

  @Column({ nullable: true, length: 100 })
  owner_name?: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password_hash: string;

  @Column({ nullable: true, length: 20 })
  phone?: string;

  @Column({ type: 'text', nullable: true })
  address?: string;

  @Column({ nullable: true, length: 100 })
  city?: string;

  @Column({ nullable: true, length: 20 })
  postal_code?: string;

  @Column({ type: 'decimal', precision: 10, scale: 8 })
  latitude: number;

  @Column({ type: 'decimal', precision: 11, scale: 8 })
  longitude: number;

  @Column({ nullable: true, length: 50 })
  business_type?: string;

  @Column({ nullable: true, length: 500 })
  logo_url?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ nullable: true, length: 300 })
  website?: string;

  @Column({ nullable: true, length: 100 })
  instagram?: string;

  @Column({ nullable: true, length: 100 })
  facebook?: string;

  @Column({ default: 'pending', length: 20 })
  status: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}