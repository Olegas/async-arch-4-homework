import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  NotFoundException,
  ForbiddenException
} from '@nestjs/common';
import { TaskService } from './task.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { ProducerService } from '../kafka/producer.service';
import { UsersService } from '../users/users.service';
import { CurrentUser } from '../current-user.decorator';
import { User } from '../users/entities/user.entity';
import { Roles } from '../roles.decorator';
import { RolesGuard } from '../roles.guard';
import { SchemaService } from '../schema/schema.service';

@Controller('task')
@UseGuards(RolesGuard)
export class TaskController {
  constructor(
    private readonly taskService: TaskService,
    private readonly producer: ProducerService,
    private readonly userService: UsersService,
    private readonly validator: SchemaService
  ) {}

  @Post()
  async create(@Body() createTaskDto: CreateTaskDto) {
    const [_, assignee] = await this.userService.pickRandomUser();
    const result = await this.taskService.create({
      ...createTaskDto,
      status: 'in-development',
      assignee
    });
    const payload = {
      uuid: result.uuid,
      assignee
    };
    const event = {
      topic: 'task_lifecycle',
      event: 'assigned',
      version: '1',
      payload
    };
    const isValid = await this.validator.validateSchema(event);
    if (!isValid) {
      throw new Error('Incorrect schema');
    }
    await this.producer.produce(event);
    return result;
  }

  @Get()
  findAll(@CurrentUser() currentUser: User) {
    return this.taskService.findMy(currentUser.uuid);
  }

  @Get(':uuid')
  async findOne(@Param('uuid') uuid: string, @CurrentUser() currentUser: User) {
    const task = await this.taskService.findOne(uuid);
    if (task) {
      if (
        ['admin', 'manager'].includes(currentUser.role) ||
        task.assignee === currentUser.uuid
      ) {
        return task;
      }
      throw new ForbiddenException();
    }
    throw new NotFoundException();
  }

  @Post('shuffle')
  @Roles('manager', 'admin')
  async shuffle() {
    const users = await this.userService.findAll();
    const tasks = await this.taskService.findAllInDevelopment();
    // TODO transaction
    // TODO locking? (to prevent multiple simultaneous shuffles)
    for (const task of tasks) {
      const assignee = users[(Math.random() * users.length) >> 0].uuid;
      await this.taskService.updateByUuid(task.uuid, { assignee });
      const payload = {
        uuid: task.uuid,
        assignee
      };
      const event = {
        topic: 'task_lifecycle',
        event: 'assigned',
        version: '1',
        payload
      };
      const isValid = await this.validator.validateSchema(event);
      if (!isValid) {
        throw new Error('Incorrect schema');
      }
      await this.producer.produce(event);
    }
    // TODO unlock
  }

  @Post(':uuid/done')
  async completeTask(
    @Param('uuid') uuid: string,
    @CurrentUser() currentUser: User
  ) {
    const task = await this.taskService.findOne(uuid);
    if (task.assignee === currentUser.uuid || currentUser.role === 'admin') {
      if (task.status !== 'done') {
        // TODO put publishing to the transaction to rollback changes if event is not published correctly
        await this.taskService.updateByUuid(uuid, { status: 'done' });
        const payload = {
          assignee: task.assignee,
          uuid
        };
        const event = {
          topic: 'task_lifecycle',
          event: 'completed',
          version: '1',
          payload
        };
        const isValid = await this.validator.validateSchema(event);
        if (!isValid) {
          throw new Error('Incorrect schema');
        }
        await this.producer.produce(event);
      }
      return 'ok';
    }
    throw new ForbiddenException();
  }
}
