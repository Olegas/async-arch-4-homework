import {
  Injectable,
  OnApplicationShutdown,
  OnModuleInit
} from '@nestjs/common';
import { Kafka } from 'kafkajs';
import { nanoid } from 'nanoid';

interface ProduceArgs {
  topic: string;
  event: string;
  version: string;
  payload: Record<string, any>;
}

@Injectable()
export class ProducerService implements OnModuleInit, OnApplicationShutdown {
  private readonly kafka = new Kafka({
    brokers: [process.env.KAFKA_BROKER]
  });

  private readonly producer = this.kafka.producer();

  async produce({ topic, event, version, payload }: ProduceArgs) {
    await this.producer.send({
      topic,
      messages: [
        {
          headers: {
            id: nanoid(),
            version,
            event
          },
          value: JSON.stringify(payload)
        }
      ]
    });
  }

  async onModuleInit() {
    await this.producer.connect();
  }

  async onApplicationShutdown() {
    await this.producer.disconnect();
  }
}
