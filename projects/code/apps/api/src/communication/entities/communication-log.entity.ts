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
import { CommunicationTemplate } from './communication-template.entity'

export type LogChannel = 'whatsapp' | 'email'
export type LogType = 'automated' | 'manual' | 'billing'
export type LogStatus = 'sent' | 'failed'

@Entity('communication_logs')
export class CommunicationLog {
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

  @Column({ type: 'char', length: 36, nullable: true })
  template_id: string | null

  @ManyToOne(() => CommunicationTemplate, { nullable: true })
  @JoinColumn({ name: 'template_id' })
  template: CommunicationTemplate | null

  @Column({ type: 'enum', enum: ['whatsapp', 'email'] })
  channel: LogChannel

  @Column({ type: 'enum', enum: ['automated', 'manual', 'billing'] })
  type: LogType

  @Column({ type: 'enum', enum: ['sent', 'failed'] })
  status: LogStatus

  @Column({ type: 'text' })
  body_snapshot: string
}
