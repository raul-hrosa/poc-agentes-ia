import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm'
import { Psychologist } from '../../psychologists/entities/psychologist.entity'
import { Patient } from '../../patients/entities/patient.entity'

export type ChargeStatus = 'pending' | 'paid' | 'expired' | 'cancelled'

@Entity('charges')
@Index('idx_charges_psychologist_status', ['psychologist_id', 'status'])
export class Charge {
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

  @Column({ type: 'int', unsigned: true })
  amount_cents: number

  @Column({ type: 'date' })
  due_date: string

  @Column({
    type: 'enum',
    enum: ['pending', 'paid', 'expired', 'cancelled'],
    default: 'pending',
  })
  status: ChargeStatus

  @Column({ length: 255, nullable: true })
  stripe_payment_intent_id: string | null

  @Column({ type: 'text', nullable: true })
  stripe_payment_link: string | null

  @Column({ type: 'datetime', nullable: true })
  paid_at: Date | null
}
