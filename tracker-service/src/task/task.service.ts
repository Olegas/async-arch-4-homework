import { Injectable } from '@nestjs/common';
import { CreateAssignedTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './entities/task.entity';
import { ProducerService } from '../kafka/producer.service';

@Injectable()
export class TaskService {
  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    private producer: ProducerService
  ) {}

  async create(createTaskDto: CreateAssignedTaskDto) {
    const result = await this.taskRepository.save(createTaskDto);
    await this.producer.produce('tasks-streaming', {
      message: 'task-created',
      data: {
        uuid: result.uuid,
        status: result.status,
        title: result.title,
        description: result.description,
        assignee: result.assignee
      }
    });
    return result;
  }

  findAll() {
    return this.taskRepository.find();
  }

  findOne(uuid: string) {
    return this.taskRepository.findOneBy({ uuid });
  }

  findMy(assignee: string) {
    return this.taskRepository.find({
      where: {
        assignee,
        status: 'in-development'
      }
    });
  }

  findAllInDevelopment() {
    return this.taskRepository.find({
      where: {
        status: 'in-development'
      }
    });
  }

  update(id: number, updateTaskDto: UpdateTaskDto) {
    return this.taskRepository.update({ id }, updateTaskDto);
  }

  async updateByUuid(uuid: string, updateTaskDto: UpdateTaskDto) {
    const task = await this.taskRepository.findOneBy({ uuid });
    const result = await this.taskRepository.update({ uuid }, updateTaskDto);
    await this.producer.produce('tasks-streaming', {
      message: 'task-updated',
      data: {
        uuid: task.uuid,
        status: updateTaskDto.status,
        title: task.title,
        description: task.description
      }
    });
    return result;
  }

  remove(id: number) {
    return `This action removes a #${id} task`;
  }
}
