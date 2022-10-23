import { Injectable } from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Task } from './entities/task.entity';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';

@Injectable()
export class TaskService {
  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>
  ) {}

  create(createTaskDto: CreateTaskDto) {
    return this.taskRepository.save({
      uuid: createTaskDto.uuid,
      title: createTaskDto.title,
      jiraId: createTaskDto.jiraId,
      priceAssign: Math.random() * 10 - 20,
      priceComplete: Math.random() * 20 + 20
    });
  }

  findOne(uuid: string): Promise<Task> {
    return this.taskRepository.findOneBy({ uuid });
  }
}
