import { Module } from '@nestjs/common';
import { User } from './entities/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ListenerService } from './listener.service';
import { UsersService } from './users.service';
import { KafkaModule } from '../kafka/kafka.module';

@Module({
  imports: [TypeOrmModule.forFeature([User]), KafkaModule],
  controllers: [],
  providers: [ListenerService, UsersService],
  exports: [UsersService]
})
export class UsersModule {}
