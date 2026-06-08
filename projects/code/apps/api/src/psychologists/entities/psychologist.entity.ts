import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm'

@Entity('psychologists')
export class Psychologist {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @CreateDateColumn({ type: 'datetime', precision: 3 })
  created_at: Date

  @UpdateDateColumn({ type: 'datetime', precision: 3 })
  updated_at: Date

  @Column({ length: 255, unique: true })
  email: string

  @Column({ length: 255 })
  password_hash: string

  @Column({ length: 255 })
  full_name: string

  @Column({ length: 50 })
  crp: string

  @Column({ type: 'char', length: 2 })
  state: string

  @Column({ length: 20, nullable: true })
  phone: string | null

  @Column({ length: 500, nullable: true })
  avatar_path: string | null

  @Column({ length: 300, nullable: true })
  bio: string | null

  @Column({ length: 50, nullable: true })
  approach: string | null

  @Column({ type: 'json', default: '[]' })
  specialties: string[]

  @Column({ type: 'tinyint', unsigned: true, default: 50 })
  session_duration_min: number

  @Column({ type: 'int', unsigned: true, default: 0 })
  session_price_cents: number

  @Column({ type: 'tinyint', unsigned: true, default: 0 })
  gap_between_sessions_min: number

  @Column({ type: 'smallint', unsigned: true, default: 24 })
  min_booking_advance_hours: number

  @Column({ type: 'smallint', unsigned: true, default: 24 })
  min_cancellation_advance_hours: number

  @Column({ length: 500, nullable: true })
  cancellation_policy: string | null

  @Column({ type: 'boolean', default: true })
  public_booking_enabled: boolean

  @Column({ length: 100, unique: true })
  public_booking_slug: string

  @Column({ type: 'boolean', default: false })
  public_show_price: boolean

  @Column({ type: 'boolean', default: false })
  public_require_approval: boolean

  @Column({ type: 'boolean', default: false })
  email_confirmed: boolean

  @Column({ length: 100, nullable: true })
  email_confirm_token: string | null

  @Column({ length: 100, nullable: true })
  password_reset_token: string | null

  @Column({ type: 'datetime', nullable: true })
  password_reset_expires_at: Date | null

  @Column({ type: 'tinyint', unsigned: true, default: 0 })
  login_attempts: number

  @Column({ type: 'datetime', nullable: true })
  locked_until: Date | null
}
