import {
  Injectable,
  OnApplicationShutdown,
  OnModuleInit
} from '@nestjs/common';
import { Kafka } from 'kafkajs';

@Injectable()
export class ProducerService implements OnModuleInit, OnApplicationShutdown {
  private readonly kafka = new Kafka({
    brokers: [process.env.KAFKA_BROKER]
  });

  private readonly producer = this.kafka.producer();

  async produce(topic: string, message: Record<string, any>) {
    await this.producer.send({
      topic,
      messages: [
        {
          value: JSON.stringify(message)
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
