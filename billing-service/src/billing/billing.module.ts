import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BillingCycle } from './entities/billingCycle.entity';
import { Transaction } from './entities/transaction.entity';
import { TransactionService } from './transaction.service';
import { BillingCycleService } from './billing-cycle.service';

@Module({
  imports: [TypeOrmModule.forFeature([Transaction, BillingCycle])],
  providers: [TransactionService, BillingCycleService],
  exports: [TransactionService, BillingCycleService]
})
export class BillingModule {}
