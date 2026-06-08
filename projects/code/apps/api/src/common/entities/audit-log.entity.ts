import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm'

@Entity('audit_logs')
@Index('idx_audit_logs_psychologist_date', ['psychologist_id', 'created_at'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @CreateDateColumn({ type: 'datetime', precision: 3 })
  created_at: Date

  @Column({ type: 'char', length: 36 })
  psychologist_id: string

  @Column({ length: 100 })
  action: string

  @Column({ length: 50 })
  resource_type: string

  @Column({ type: 'char', length: 36 })
  resource_id: string

  @Column({ length: 45, nullable: true })
  ip_address: string | null

  @Column({ type: 'json', default: '{}' })
  metadata: Record<string, unknown>
}
