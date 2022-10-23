import { Module } from '@nestjs/common';
import { DeadLetteringService } from './dead-lettering.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeadLetter } from './entity/dead-letter.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DeadLetter])],
  providers: [DeadLetteringService],
  exports: [DeadLetteringService]
})
export class DeadLetteringModule {}
