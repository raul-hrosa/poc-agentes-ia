import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm'
import { Psychologist } from '../../psychologists/entities/psychologist.entity'
import { Patient } from '../../patients/entities/patient.entity'
import { Charge } from './charge.entity'
import { Session } from '../../sessions/entities/session.entity'

export type PaymentMethod =
  | 'pix'
  | 'cash'
  | 'debit_card'
  | 'credit_card'
  | 'transfer'
  | 'other'

@Entity('payments')
export class Payment {
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
  paid_at: string

  @Column({
    type: 'enum',
    enum: ['pix', 'cash', 'debit_card', 'credit_card', 'transfer', 'other'],
  })
  method: PaymentMethod

  @Column({ type: 'text', nullable: true })
  notes: string | null

  @Column({ type: 'char', length: 36, nullable: true })
  charge_id: string | null

  @ManyToOne(() => Charge, { nullable: true })
  @JoinColumn({ name: 'charge_id' })
  charge: Charge | null

  @ManyToMany(() => Session)
  @JoinTable({
    name: 'payment_sessions',
    joinColumn: { name: 'payment_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'session_id', referencedColumnName: 'id' },
  })
  sessions: Session[]
}
