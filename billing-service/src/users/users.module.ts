import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { ListenerService } from './listener.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { KafkaModule } from '../kafka/kafka.module';
import { SchemaModule } from '../schema/schema.module';

@Module({
  imports: [TypeOrmModule.forFeature([User]), KafkaModule, SchemaModule],
  exports: [UsersService],
  providers: [UsersService, ListenerService]
})
export class UsersModule {}
