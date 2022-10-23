import { Module } from '@nestjs/common';
import { TaskService } from './task.service';
import { TaskController } from './task.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from './entities/task.entity';
import { KafkaModule } from '../kafka/kafka.module';
import { UsersModule } from '../users/users.module';
import { SchemaModule } from '../schema/schema.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Task]),
    KafkaModule,
    UsersModule,
    SchemaModule
  ],
  controllers: [TaskController],
  providers: [TaskService]
})
export class TaskModule {}
