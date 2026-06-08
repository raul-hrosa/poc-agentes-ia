import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm'
import { Psychologist } from '../../psychologists/entities/psychologist.entity'

export type PatientStatus = 'active' | 'paused' | 'archived'

@Entity('patients')
@Index('idx_patients_status', ['psychologist_id', 'status'])
export class Patient {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @CreateDateColumn({ type: 'datetime', precision: 3 })
  created_at: Date

  @UpdateDateColumn({ type: 'datetime', precision: 3 })
  updated_at: Date

  @Index('idx_patients_psychologist')
  @Column({ type: 'char', length: 36 })
  psychologist_id: string

  @ManyToOne(() => Psychologist, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'psychologist_id' })
  psychologist: Psychologist

  @Column({ length: 255 })
  full_name: string

  @Column({ type: 'date' })
  birth_date: string

  @Column({ length: 20 })
  phone: string

  @Column({ length: 255 })
  email: string

  @Column({ length: 50, nullable: true })
  gender: string | null

  @Column({ length: 50, nullable: true })
  marital_status: string | null

  @Column({ length: 100, nullable: true })
  occupation: string | null

  @Column({ length: 50, nullable: true })
  referral_source: string | null

  @Column({ length: 255, nullable: true })
  emergency_contact_name: string | null

  @Column({ length: 20, nullable: true })
  emergency_contact_phone: string | null

  @Column({ type: 'text', nullable: true })
  notes: string | null

  @Column({
    type: 'enum',
    enum: ['active', 'paused', 'archived'],
    default: 'active',
  })
  status: PatientStatus

  @Column({ type: 'int', unsigned: true, nullable: true })
  session_price_cents: number | null

  @Column({ type: 'json', default: '[]' })
  tags: string[]

  @Column({ length: 500, nullable: true })
  avatar_path: string | null

  @Column({ type: 'date', nullable: true })
  started_at: string | null
}
