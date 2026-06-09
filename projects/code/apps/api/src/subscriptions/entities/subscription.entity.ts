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
import { SubscriptionPlan, SubscriptionStatus } from '@psiclinica/types'
import { Psychologist } from '../../psychologists/entities/psychologist.entity'

@Entity('subscriptions')
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @CreateDateColumn({ type: 'datetime', precision: 3 })
  created_at: Date

  @UpdateDateColumn({ type: 'datetime', precision: 3 })
  updated_at: Date

  @Index({ unique: true })
  @Column({ type: 'char', length: 36 })
  psychologist_id: string

  @ManyToOne(() => Psychologist)
  @JoinColumn({ name: 'psychologist_id' })
  psychologist: Psychologist

  @Column({ type: 'enum', enum: SubscriptionPlan, default: SubscriptionPlan.Free })
  plan: SubscriptionPlan

  @Column({ type: 'enum', enum: SubscriptionStatus, default: SubscriptionStatus.Trialing })
  status: SubscriptionStatus

  @Column({ type: 'datetime', nullable: true })
  trial_ends_at: Date | null

  @Column({ type: 'datetime', nullable: true })
  current_period_starts_at: Date | null

  @Column({ type: 'datetime', nullable: true })
  current_period_ends_at: Date | null

  @Column({ type: 'boolean', default: false })
  cancel_at_period_end: boolean

  @Column({ length: 255, nullable: true })
  stripe_customer_id: string | null

  @Column({ length: 255, nullable: true })
  stripe_subscription_id: string | null

  @Column({ type: 'datetime', nullable: true })
  cancelled_at: Date | null
}
