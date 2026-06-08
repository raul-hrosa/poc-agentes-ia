import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm'
import { Psychologist } from '../../psychologists/entities/psychologist.entity'
import { Patient } from '../../patients/entities/patient.entity'

export type RecurrenceFrequency = 'weekly' | 'biweekly' | 'monthly'
export type SessionModality = 'in_person' | 'online'

@Entity('session_recurrences')
export class SessionRecurrence {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @CreateDateColumn({ type: 'datetime', precision: 3 })
  created_at: Date

  @Column({ type: 'char', length: 36 })
  psychologist_id: string

  @ManyToOne(() => Psychologist)
  @JoinColumn({ name: 'psychologist_id' })
  psychologist: Psychologist

  @Column({ type: 'char', length: 36 })
  patient_id: string

  @ManyToOne(() => Patient)
  @JoinColumn({ name: 'patient_id' })
  patient: Patient

  @Column({ type: 'enum', enum: ['weekly', 'biweekly', 'monthly'] })
  frequency: RecurrenceFrequency

  @Column({ type: 'date' })
  start_date: string

  @Column({ type: 'date', nullable: true })
  end_date: string | null

  @Column({ type: 'tinyint', unsigned: true })
  day_of_week: number

  @Column({ type: 'time' })
  time_of_day: string

  @Column({ type: 'smallint', unsigned: true })
  duration_min: number

  @Column({ type: 'enum', enum: ['in_person', 'online'] })
  modality: SessionModality

  @Column({ length: 255, nullable: true })
  location: string | null

  @Column({ type: 'int', unsigned: true })
  price_cents: number
}
