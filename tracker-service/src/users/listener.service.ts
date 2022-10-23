import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConsumerService } from '../kafka/consumer.service';
import { UsersService } from './users.service';
import {
  UserCreatedMessage,
  UserDeletedMessage,
  UserUpdatedMessage
} from './dto/messages';
import { SchemaService } from '../schema/schema.service';

@Injectable()
export class ListenerService implements OnModuleInit {
  constructor(
    private consumer: ConsumerService,
    private usersService: UsersService,
    private validator: SchemaService
  ) {}

  async onModuleInit() {
    await this.consumer.consume('users-streaming', {
      eachMessage: async ({ topic, message }) => {
        const {
          value,
          headers: { event, version }
        } = message;
        const eventAsString = event.toString();
        const versionAsString = version.toString();
        const payload = JSON.parse(value.toString());
        const isValid = await this.validator.validateSchema({
          topic,
          event: eventAsString,
          version: versionAsString,
          payload
        });

        if (isValid) {
          switch (eventAsString) {
            case 'created':
              await this.usersService.create(payload as UserCreatedMessage);
              break;
            case 'deleted':
              await this.usersService.removeByUuid(
                (payload as UserDeletedMessage).uuid
              );
              break;
            case 'updated':
              const { uuid, role } = payload as UserUpdatedMessage;
              await this.usersService.updateByUUID(uuid, { role });
          }
        } else {
          console.error(`Message ${JSON.stringify(message)} is not valid`);
        }
      }
    });
  }
}
