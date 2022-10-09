import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConsumerService } from '../kafka/consumer.service';
import { UsersService } from './users.service';
import { UserStreamMessages } from './dto/messages';

@Injectable()
export class ListenerService implements OnModuleInit {
  constructor(
    private consumer: ConsumerService,
    private usersService: UsersService
  ) {}

  async onModuleInit() {
    await this.consumer.consume('users-streaming', {
      eachMessage: async ({ message }) => {
        const { value } = message;
        const payload = JSON.parse(value.toString()) as UserStreamMessages;

        switch (payload.message) {
          case 'user-created':
            await this.usersService.create(payload.data);
            break;
          case 'user-deleted':
            await this.usersService.removeByUuid(payload.data.uuid);
            break;
          case 'user-updated':
            const { uuid, role } = payload.data;
            await this.usersService.updateByUUID(uuid, { role });
        }
      }
    });
  }
}
