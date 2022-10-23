import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from '../users/entities/user.entity';
import { Task } from '../task/entities/task.entity';
import { BillingCycleService } from './billing-cycle.service';
import { Operation, Transaction } from './entities/transaction.entity';
import { EntityManager } from 'typeorm/entity-manager/EntityManager';

@Injectable()
export class TransactionService {
  constructor(private billingCycleService: BillingCycleService) {}

  async withdraw(manager: EntityManager, user: User, amount: number) {
    const billingCycle = await this.billingCycleService.getActiveFor(user);
    if (!billingCycle) throw new NotFoundException();

    await manager.save(Transaction, {
      user,
      billingCycle,
      operation: Operation.withdraw,
      outcome: amount
    });
  }

  async deposit(
    manager: EntityManager,
    user: User,
    task: Task,
    amount: number
  ) {
    const billingCycle = await this.billingCycleService.getActiveFor(user);
    if (!billingCycle) throw new NotFoundException();

    await manager.save(Transaction, {
      user,
      billingCycle,
      task,
      operation: Operation.deposit,
      income: amount
    });
  }

  async payment(
    manager: EntityManager,
    user: User,
    task: Task,
    amount: number
  ) {
    const billingCycle = await this.billingCycleService.getActiveFor(user);
    if (!billingCycle) throw new NotFoundException();

    await manager.save(Transaction, {
      user,
      billingCycle,
      task,
      operation: Operation.payment,
      outcome: amount
    });
  }
}
