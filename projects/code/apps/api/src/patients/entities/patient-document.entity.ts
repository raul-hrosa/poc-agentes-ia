import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm'
import { Psychologist } from '../../psychologists/entities/psychologist.entity'
import { Patient } from './patient.entity'

@Entity('patient_documents')
export class PatientDocument {
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

  @Column({ length: 500 })
  r2_object_key: string

  @Column({ length: 255 })
  file_name: string

  @Column({ type: 'int', unsigned: true })
  file_size_bytes: number

  @Column({ length: 50 })
  mime_type: string
}
