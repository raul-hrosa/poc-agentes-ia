import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { MedicalRecord } from './entities/medical-record.entity'
import { MedicalRecordVersion } from './entities/medical-record-version.entity'
import { TherapeuticPlan } from './entities/therapeutic-plan.entity'

@Module({
  imports: [TypeOrmModule.forFeature([MedicalRecord, MedicalRecordVersion, TherapeuticPlan])],
  exports: [TypeOrmModule],
})
export class RecordsModule {}
