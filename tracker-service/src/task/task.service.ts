import { Injectable } from '@nestjs/common';
import { CreateAssignedTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './entities/task.entity';
import { ProducerService } from '../kafka/producer.service';
import { SchemaService } from '../schema/schema.service';

@Injectable()
export class TaskService {
  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    private producer: ProducerService,
    private validator: SchemaService
  ) {}

  async create(createTaskDto: CreateAssignedTaskDto) {
    const { title } = createTaskDto;
    const reJiraId = /^\[([^\]]+)]/;
    const matchJiraId = title.match(reJiraId);
    if (matchJiraId) {
      createTaskDto.jiraId = matchJiraId[1];
      createTaskDto.title = createTaskDto.title.replace(reJiraId, '');
    }
    const result = await this.taskRepository.save(createTaskDto);
    // TODO put publishing to the transaction to rollback changes if event is not published correctly
    const event = {
      topic: 'tasks-streaming',
      event: 'created',
      version: '2',
      payload: {
        uuid: result.uuid,
        status: result.status,
        title: result.title,
        jiraId: result.jiraId,
        description: result.description,
        assignee: result.assignee
      }
    };
    const isValid = await this.validator.validateSchema(event);
    if (!isValid) {
      throw new Error('Incorrect schema');
    }
    await this.producer.produce(event);
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
    const event = {
      topic: 'tasks-streaming',
      event: 'updated',
      version: '1',
      payload: {
        uuid: task.uuid,
        status: updateTaskDto.status,
        title: task.title,
        description: task.description
      }
    };
    const isValid = await this.validator.validateSchema(event);
    if (!isValid) {
      throw new Error('Incorrect schema');
    }
    await this.producer.produce(event);
    return result;
  }
}
