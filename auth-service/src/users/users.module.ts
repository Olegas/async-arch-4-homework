import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { KafkaModule } from '../kafka/kafka.module';
import { SchemaModule } from '../schema/schema.module';

@Module({
  imports: [TypeOrmModule.forFeature([User]), KafkaModule, SchemaModule],
  controllers: [UsersController],
  providers: [UsersService]
})
export class UsersModule {}
