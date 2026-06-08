import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm'
import { Psychologist } from '../../psychologists/entities/psychologist.entity'

export type TemplateCategory =
  | 'reminder'
  | 'cancellation'
  | 'billing'
  | 'onboarding'
  | 'sensitive'

export type TemplateChannel = 'whatsapp' | 'email' | 'both'

@Entity('communication_templates')
export class CommunicationTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @CreateDateColumn({ type: 'datetime', precision: 3 })
  created_at: Date

  @Column({ type: 'char', length: 36, nullable: true })
  psychologist_id: string | null

  @ManyToOne(() => Psychologist, { nullable: true })
  @JoinColumn({ name: 'psychologist_id' })
  psychologist: Psychologist | null

  @Column({
    type: 'enum',
    enum: ['reminder', 'cancellation', 'billing', 'onboarding', 'sensitive'],
  })
  category: TemplateCategory

  @Column({ length: 100 })
  name: string

  @Column({ type: 'text' })
  body: string

  @Column({ type: 'boolean', default: false })
  is_system: boolean

  @Column({ type: 'enum', enum: ['whatsapp', 'email', 'both'] })
  channel: TemplateChannel
}
