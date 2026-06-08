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

export type ClinicalDocumentType =
  | 'attendance_declaration'
  | 'psychological_report'
  | 'referral'
  | 'attendance_certificate'

@Entity('clinical_documents')
export class ClinicalDocument {
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

  @Column({
    type: 'enum',
    enum: [
      'attendance_declaration',
      'psychological_report',
      'referral',
      'attendance_certificate',
    ],
  })
  document_type: ClinicalDocumentType

  @Column({ length: 500 })
  r2_object_key: string

  @Column({ length: 255 })
  title: string
}
