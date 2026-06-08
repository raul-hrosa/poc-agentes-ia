import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm'
import { Psychologist } from './psychologist.entity'

@Entity('schedule_availability')
export class ScheduleAvailability {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Index('idx_availability_psychologist')
  @Column({ type: 'char', length: 36 })
  psychologist_id: string

  @ManyToOne(() => Psychologist, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'psychologist_id' })
  psychologist: Psychologist

  @Column({ type: 'tinyint', unsigned: true, comment: '0=Sun … 6=Sat' })
  day_of_week: number

  @Column({ type: 'time' })
  start_time: string

  @Column({ type: 'time' })
  end_time: string
}
