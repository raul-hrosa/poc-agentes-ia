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
import { Session } from '../../sessions/entities/session.entity'

@Entity('medical_records')
@Index('idx_medical_records_patient', ['patient_id'])
@Index('idx_medical_records_session', ['session_id'])
export class MedicalRecord {
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

  @Column({ type: 'char', length: 36 })
  patient_id: string

  @ManyToOne(() => Patient)
  @JoinColumn({ name: 'patient_id' })
  patient: Patient

  @Column({ type: 'char', length: 36, nullable: true })
  session_id: string | null

  @ManyToOne(() => Session, { nullable: true })
  @JoinColumn({ name: 'session_id' })
  session: Session | null

  @Column({ type: 'longblob' })
  content_encrypted: Buffer

  @Column({ type: 'longblob', nullable: true })
  private_notes_encrypted: Buffer | null

  @Column({ type: 'tinyint', unsigned: true, nullable: true })
  mood_score: number | null

  @Column({ type: 'json', default: '[]' })
  techniques_used: string[]

  @Column({ type: 'json', default: '[]' })
  next_steps: string[]

  @Column({ type: 'smallint', unsigned: true, default: 1 })
  version: number
}
