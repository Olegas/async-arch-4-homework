import { Module } from '@nestjs/common';
import { KafkaModule } from './kafka/kafka.module';
import { SchemaModule } from './schema/schema.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { User } from './users/entities/user.entity';
import { TaskModule } from './task/task.module';
import { Task } from './task/entities/task.entity';
import { Transaction } from './billing/entities/transaction.entity';
import { BillingCycle } from './billing/entities/billingCycle.entity';
import { BillingModule } from './billing/billing.module';
import { DeadLetteringModule } from './dead-lettering/dead-lettering.module';
import { DeadLetter } from './dead-lettering/entity/dead-letter.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: +(process.env.DB_PORT || 5432),
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME,
      entities: [User, Task, Transaction, BillingCycle, DeadLetter],
      synchronize: true
    }),
    KafkaModule,
    SchemaModule,
    UsersModule,
    TaskModule,
    BillingModule,
    DeadLetteringModule
  ],
  controllers: [],
  providers: []
})
export class AppModule {}
