import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Patient } from './entities/patient.entity'
import { Anamnesis } from './entities/anamnesis.entity'
import { PatientDocument } from './entities/patient-document.entity'

@Module({
  imports: [TypeOrmModule.forFeature([Patient, Anamnesis, PatientDocument])],
  exports: [TypeOrmModule],
})
export class PatientsModule {}
