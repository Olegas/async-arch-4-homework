import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { BillingCycle } from './entities/billingCycle.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';

@Injectable()
export class BillingCycleService {
  constructor(
    @InjectRepository(BillingCycle)
    private billingCycleRepository: Repository<BillingCycle>,
    private dataSource: DataSource
  ) {}
  async getActiveFor(user: User) {
    return this.dataSource.transaction(async (manager) => {
      await manager.query(
        "SELECT pg_advisory_xact_lock('billing_cycle'::regclass::oid::bigint)"
      );
      const result = await manager.findOneBy(BillingCycle, {
        active: true,
        user
      });
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      if (!result) {
        return await manager.save(BillingCycle, {
          active: true,
          user,
          from: today.toISOString(),
          to: tomorrow.toISOString()
        });
      }
      return result;
    });
  }
}
