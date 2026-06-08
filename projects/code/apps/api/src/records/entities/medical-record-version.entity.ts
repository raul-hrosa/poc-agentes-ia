import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm'
import { MedicalRecord } from './medical-record.entity'

@Entity('medical_record_versions')
export class MedicalRecordVersion {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Index('idx_record_versions_record')
  @Column({ type: 'char', length: 36 })
  record_id: string

  @ManyToOne(() => MedicalRecord)
  @JoinColumn({ name: 'record_id' })
  record: MedicalRecord

  @Column({ type: 'smallint', unsigned: true })
  version: number

  @Column({ type: 'longblob' })
  content_encrypted: Buffer

  @CreateDateColumn({ type: 'datetime', precision: 3 })
  edited_at: Date

  @Column({ type: 'char', length: 36 })
  psychologist_id: string
}
