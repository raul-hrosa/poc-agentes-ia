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

@Entity('therapeutic_plans')
export class TherapeuticPlan {
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

  @Column({ type: 'smallint', unsigned: true, default: 1 })
  version: number

  @Column({ type: 'longblob', nullable: true })
  short_term_goals_encrypted: Buffer | null

  @Column({ type: 'longblob', nullable: true })
  mid_term_goals_encrypted: Buffer | null

  @Column({ type: 'longblob', nullable: true })
  long_term_goals_encrypted: Buffer | null

  @Column({ type: 'longblob', nullable: true })
  diagnosis_hypothesis_encrypted: Buffer | null

  @Column({ length: 10, nullable: true })
  cid10: string | null

  @Column({ type: 'longblob', nullable: true })
  strategies_encrypted: Buffer | null

  @Column({ type: 'datetime', nullable: true })
  superseded_at: Date | null
}
