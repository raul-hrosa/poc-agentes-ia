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
import { Patient } from '../../patients/entities/patient.entity'
import { SessionRecurrence } from './session-recurrence.entity'

export type SessionStatus =
  | 'scheduled'
  | 'confirmed'
  | 'completed'
  | 'missed'
  | 'cancelled_patient'
  | 'cancelled_psychologist'
  | 'rescheduled'

export type SessionModality = 'in_person' | 'online'

@Entity('sessions')
@Index('idx_sessions_psychologist_date', ['psychologist_id', 'scheduled_at'])
@Index('idx_sessions_patient', ['patient_id'])
@Index('idx_sessions_recurrence', ['recurrence_id'])
export class Session {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @CreateDateColumn({ type: 'datetime', precision: 3 })
  created_at: Date

  @UpdateDateColumn({ type: 'datetime', precision: 3 })
  updated_at: Date

  @Column({ type: 'char', length: 36 })
  psychologist_id: string

  @ManyToOne(() => Psychologist, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'psychologist_id' })
  psychologist: Psychologist

  @Column({ type: 'char', length: 36 })
  patient_id: string

  @ManyToOne(() => Patient, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'patient_id' })
  patient: Patient

  @Column({ type: 'char', length: 36, nullable: true })
  recurrence_id: string | null

  @ManyToOne(() => SessionRecurrence, { nullable: true })
  @JoinColumn({ name: 'recurrence_id' })
  recurrence: SessionRecurrence | null

  @Column({ type: 'datetime' })
  scheduled_at: Date

  @Column({ type: 'smallint', unsigned: true })
  duration_min: number

  @Column({ type: 'enum', enum: ['in_person', 'online'] })
  modality: SessionModality

  @Column({ length: 255, nullable: true })
  location: string | null

  @Column({ type: 'int', unsigned: true })
  price_cents: number

  @Column({
    type: 'enum',
    enum: [
      'scheduled',
      'confirmed',
      'completed',
      'missed',
      'cancelled_patient',
      'cancelled_psychologist',
      'rescheduled',
    ],
    default: 'scheduled',
  })
  status: SessionStatus

  @Column({ type: 'int', unsigned: true, nullable: true })
  cancellation_fee_cents: number | null

  @Column({ type: 'text', nullable: true })
  notes: string | null

  @Column({ type: 'datetime', nullable: true })
  cancelled_at: Date | null

  @Column({ type: 'datetime', nullable: true })
  completed_at: Date | null
}
