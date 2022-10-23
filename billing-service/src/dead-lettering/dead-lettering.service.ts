import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeadLetter } from './entity/dead-letter.entity';
import { DataSource, Repository } from 'typeorm';
import { DeadLetterDto } from './dto/dead-letter.dto';

@Injectable()
export class DeadLetteringService {
  constructor(
    @InjectRepository(DeadLetter)
    private deadLetterRepository: Repository<DeadLetter>,
    private dataSource: DataSource
  ) {}

  create(deadLetterDto: DeadLetterDto) {
    return this.deadLetterRepository.save({
      event: JSON.stringify(deadLetterDto.event)
    });
  }

  // TODO implement batch processing
  handleOne(handler: (event: Record<string, any>) => Promise<void>) {
    return this.dataSource.transaction(async (manager) => {
      const items = await manager.query(
        'SELECT id, event FROM dead_letter ORDER BY "createdAt" LIMIT 1 FOR UPDATE'
      );
      if (items && items.length === 1) {
        const [item] = items;
        const { id, event } = item;
        await handler(JSON.parse(event));
        await manager.delete(DeadLetter, { id });
      }
    });
  }
}
