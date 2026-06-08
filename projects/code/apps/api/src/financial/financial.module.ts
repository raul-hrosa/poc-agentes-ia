import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Payment } from './entities/payment.entity'
import { Charge } from './entities/charge.entity'

@Module({
  imports: [TypeOrmModule.forFeature([Payment, Charge])],
  exports: [TypeOrmModule],
})
export class FinancialModule {}
