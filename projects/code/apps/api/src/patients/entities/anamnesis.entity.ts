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
import { Patient } from './patient.entity'

@Entity('anamneses')
export class Anamnesis {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @CreateDateColumn({ type: 'datetime', precision: 3 })
  created_at: Date

  @UpdateDateColumn({ type: 'datetime', precision: 3 })
  updated_at: Date

  @Column({ type: 'char', length: 36 })
  psychologist_id: string

  @ManyToOne(() => Psychologist)
  @JoinColumn({ name: 'psychologist_id' })
  psychologist: Psychologist

  @Index({ unique: true })
  @Column({ type: 'char', length: 36 })
  patient_id: string

  @ManyToOne(() => Patient)
  @JoinColumn({ name: 'patient_id' })
  patient: Patient

  @Column({ type: 'longblob', nullable: true })
  chief_complaint_encrypted: Buffer | null

  @Column({ type: 'longblob', nullable: true })
  history_encrypted: Buffer | null

  @Column({ type: 'longblob', nullable: true })
  medications_encrypted: Buffer | null

  @Column({ type: 'longblob', nullable: true })
  general_health_encrypted: Buffer | null

  @Column({ type: 'longblob', nullable: true })
  family_history_encrypted: Buffer | null

  @Column({ type: 'longblob', nullable: true })
  therapeutic_goals_encrypted: Buffer | null

  @Column({ type: 'json', default: '[]' })
  custom_fields: Record<string, unknown>[]
}
