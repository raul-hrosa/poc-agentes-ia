import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ClinicalDocument } from './entities/clinical-document.entity'

@Module({
  imports: [TypeOrmModule.forFeature([ClinicalDocument])],
  exports: [TypeOrmModule],
})
export class DocumentsModule {}
