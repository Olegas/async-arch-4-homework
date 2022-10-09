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

@Controller('task')
@UseGuards(RolesGuard)
export class TaskController {
  constructor(
    private readonly taskService: TaskService,
    private readonly producer: ProducerService,
    private readonly userService: UsersService
  ) {}

  @Post()
  async create(@Body() createTaskDto: CreateTaskDto) {
    const [_, assignee] = await this.userService.pickRandomUser();
    const result = await this.taskService.create({
      ...createTaskDto,
      status: 'in-development',
      assignee
    });
    await this.producer.produce('task_assigned', {
      uuid: result.uuid,
      assignee
    });
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
      await this.producer.produce('task_assigned', {
        uuid: task.uuid,
        assignee
      });
    }
    // TODO unlock
  }

  @Post(':uuid/done')
  async completeTask(
    @Param('uuid') uuid: string,
    @CurrentUser() currentUser: User
  ) {
    const task = await this.taskService.findOne(uuid);
    if (task.assignee === currentUser.uuid) {
      if (task.status !== 'done') {
        await this.taskService.updateByUuid(uuid, { status: 'done' });
        await this.producer.produce('task_completed', {
          uuid
        });
      }
      return 'ok';
    }
    throw new ForbiddenException();
  }
}
