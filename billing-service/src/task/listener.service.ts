import {
  Injectable,
  OnApplicationShutdown,
  OnModuleInit
} from '@nestjs/common';
import { ConsumerService } from '../kafka/consumer.service';
import {
  TaskAssignedMessage,
  TaskCompletedMessage,
  TaskCreatedMessage
} from './dto/messages';
import { SchemaService } from '../schema/schema.service';
import { TaskService } from './task.service';
import { UsersService } from '../users/users.service';
import { TransactionService } from '../billing/transaction.service';
import { EachMessagePayload } from 'kafkajs';
import { DeadLetteringService } from '../dead-lettering/dead-lettering.service';
import { DataSource } from 'typeorm';

interface Event {
  topic: string;
  event: string;
  version: string;
  payload: Record<string, any>;
}

type EventHandler = (event: Event) => Promise<void>;

@Injectable()
export class ListenerService implements OnModuleInit, OnApplicationShutdown {
  private deadLetterTimer: ReturnType<typeof setTimeout>;

  constructor(
    private consumer: ConsumerService,
    private tasksService: TaskService,
    private userService: UsersService,
    private transactionService: TransactionService,
    private validator: SchemaService,
    private deadLetterService: DeadLetteringService,
    private dataSource: DataSource
  ) {}

  parseMessage({ topic, message }: EachMessagePayload): Event {
    const {
      value,
      headers: { event, version }
    } = message;
    const eventAsString = event.toString();
    const versionAsString = version.toString();
    const payload = JSON.parse(value.toString());
    return {
      topic,
      event: eventAsString,
      version: versionAsString,
      payload
    };
  }

  validate(event: Event): Promise<boolean> {
    return this.validator.validateSchema(event);
  }

  safeHandler(handler: EventHandler): EventHandler {
    return async (event) => {
      try {
        const isValid = await this.validate(event);
        if (isValid) {
          await handler(event);
        } else {
          throw new Error('Message is not valid');
        }
      } catch (e) {
        console.error(
          `Event ${JSON.stringify(
            event
          )} was not processed. Error: ${e}. Putting to dead letter queue`
        );
        await this.deadLetterService.create({
          event
        });
      }
    };
  }

  taskStreamingHandler() {
    return this.safeHandler(async (event: Event) => {
      switch (event.event) {
        case 'created':
          // Consume only v2 version in new code
          if (event.version === '2') {
            await this.tasksService.create(event.payload as TaskCreatedMessage);
          }
          break;
      }
    });
  }

  taskLifecycleHandler() {
    return this.safeHandler(async (event: Event) => {
      switch (event.event) {
        case 'assigned': {
          await this.dataSource.transaction(async (manager) => {
            const { uuid, assignee } = event.payload as TaskAssignedMessage;
            const user = await this.userService.findOne(assignee);
            const task = await this.tasksService.findOne(uuid);
            await this.transactionService.payment(
              manager,
              user,
              task,
              task.priceAssign
            );
            await manager.query(
              'UPDATE public.user SET balance = balance + $1 WHERE id = $2',
              [task.priceAssign, user.id]
            );
          });

          break;
        }
        case 'completed': {
          await this.dataSource.transaction(async (manager) => {
            const { uuid, assignee } = event.payload as TaskCompletedMessage;
            const user = await this.userService.findOne(assignee);
            const task = await this.tasksService.findOne(uuid);
            await this.transactionService.deposit(
              manager,
              user,
              task,
              task.priceComplete
            );
            await manager.query(
              'UPDATE public.user SET balance = balance + $1 WHERE id = $2',
              [task.priceComplete, user.id]
            );
          });
          break;
        }
      }
    });
  }

  async onModuleInit() {
    const taskStreamingHandler = this.taskStreamingHandler();
    const taskLifecycleHandler = this.taskLifecycleHandler();
    const handlers = {
      'tasks-streaming': taskStreamingHandler,
      task_lifecycle: taskLifecycleHandler
    };
    const commonHandler = async (message) => {
      const event = this.parseMessage(message);
      await handlers[event.topic](event);
    };

    await this.consumer.consume('tasks-streaming', {
      eachMessage: commonHandler
    });

    await this.consumer.consume('task_lifecycle', {
      eachMessage: commonHandler
    });

    const deadLetterHandler = async () => {
      try {
        await this.deadLetterService.handleOne((event: Event) =>
          handlers[event.topic](event)
        );
      } finally {
        this.deadLetterTimer = setTimeout(deadLetterHandler, 5000);
      }
    };

    this.deadLetterTimer = setTimeout(deadLetterHandler, 5000);
  }

  onApplicationShutdown(): any {
    clearTimeout(this.deadLetterTimer);
  }
}
