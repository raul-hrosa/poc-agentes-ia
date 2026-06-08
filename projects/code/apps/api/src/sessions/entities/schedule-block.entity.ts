import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm'
import { Psychologist } from '../../psychologists/entities/psychologist.entity'

@Entity('schedule_blocks')
@Index('idx_schedule_blocks_psychologist', ['psychologist_id', 'starts_at', 'ends_at'])
export class ScheduleBlock {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'char', length: 36 })
  psychologist_id: string

  @ManyToOne(() => Psychologist, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'psychologist_id' })
  psychologist: Psychologist

  @Column({ type: 'datetime' })
  starts_at: Date

  @Column({ type: 'datetime' })
  ends_at: Date

  @Column({ length: 100, nullable: true })
  title: string | null
}
