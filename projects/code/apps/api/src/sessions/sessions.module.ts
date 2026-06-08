import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Session } from './entities/session.entity'
import { SessionRecurrence } from './entities/session-recurrence.entity'
import { ScheduleBlock } from './entities/schedule-block.entity'

@Module({
  imports: [TypeOrmModule.forFeature([Session, SessionRecurrence, ScheduleBlock])],
  exports: [TypeOrmModule],
})
export class SessionsModule {}
