import { Module } from '@nestjs/common';
import { TaskService } from './task.service';
import { ListenerService } from './listener.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from './entities/task.entity';
import { KafkaModule } from '../kafka/kafka.module';
import { SchemaModule } from '../schema/schema.module';
import { UsersModule } from '../users/users.module';
import { BillingModule } from '../billing/billing.module';
import { DeadLetteringModule } from '../dead-lettering/dead-lettering.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Task]),
    KafkaModule,
    SchemaModule,
    UsersModule,
    BillingModule,
    DeadLetteringModule
  ],
  providers: [TaskService, ListenerService]
})
export class TaskModule {}
