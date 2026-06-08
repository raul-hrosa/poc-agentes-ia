import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm'
import { Psychologist } from '../../psychologists/entities/psychologist.entity'

export type SubscriptionPlan = 'free' | 'pro' | 'clinic'
export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'cancelled'

@Entity('subscriptions')
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Index({ unique: true })
  @Column({ type: 'char', length: 36 })
  psychologist_id: string

  @ManyToOne(() => Psychologist)
  @JoinColumn({ name: 'psychologist_id' })
  psychologist: Psychologist

  @Column({ type: 'enum', enum: ['free', 'pro', 'clinic'], default: 'free' })
  plan: SubscriptionPlan

  @Column({
    type: 'enum',
    enum: ['trialing', 'active', 'past_due', 'cancelled'],
    default: 'trialing',
  })
  status: SubscriptionStatus

  @Column({ type: 'datetime', nullable: true })
  trial_ends_at: Date | null

  @Column({ type: 'datetime', nullable: true })
  current_period_ends_at: Date | null

  @Column({ length: 255, nullable: true })
  stripe_customer_id: string | null

  @Column({ length: 255, nullable: true })
  stripe_subscription_id: string | null

  @Column({ type: 'datetime', nullable: true })
  cancelled_at: Date | null
}
