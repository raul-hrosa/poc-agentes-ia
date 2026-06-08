import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Psychologist } from './entities/psychologist.entity'
import { ScheduleAvailability } from './entities/schedule-availability.entity'

@Module({
  imports: [TypeOrmModule.forFeature([Psychologist, ScheduleAvailability])],
  exports: [TypeOrmModule],
})
export class PsychologistsModule {}
