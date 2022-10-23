import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConsumerService } from '../kafka/consumer.service';
import { UsersService } from './users.service';
import { SchemaService } from '../schema/schema.service';
import { UserCreatedMessage } from './dto/messages';

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
          }
        } else {
          console.error(`Message ${JSON.stringify(message)} is not valid`);
        }
      }
    });
  }
}
