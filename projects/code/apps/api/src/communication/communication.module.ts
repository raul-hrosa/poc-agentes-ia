import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { CommunicationTemplate } from './entities/communication-template.entity'
import { CommunicationLog } from './entities/communication-log.entity'

@Module({
  imports: [TypeOrmModule.forFeature([CommunicationTemplate, CommunicationLog])],
  exports: [TypeOrmModule],
})
export class CommunicationModule {}
