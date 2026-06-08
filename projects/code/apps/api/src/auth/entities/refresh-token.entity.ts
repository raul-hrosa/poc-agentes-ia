import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm'
import { Psychologist } from '../../psychologists/entities/psychologist.entity'

@Entity('refresh_tokens')
@Index('idx_refresh_tokens_hash', ['token_hash'])
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Index('idx_refresh_tokens_psychologist')
  @Column({ type: 'char', length: 36 })
  psychologist_id: string

  @ManyToOne(() => Psychologist, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'psychologist_id' })
  psychologist: Psychologist

  @Column({ length: 255 })
  token_hash: string

  @Column({ type: 'datetime' })
  expires_at: Date

  @Column({ type: 'datetime', nullable: true })
  revoked_at: Date | null

  @Column({ length: 500, nullable: true })
  user_agent: string | null

  @Column({ length: 45, nullable: true })
  ip_address: string | null
}
