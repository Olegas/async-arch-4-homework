import { Injectable, OnApplicationShutdown } from '@nestjs/common';
import { ConsumerRunConfig, Kafka } from 'kafkajs';

@Injectable()
export class ConsumerService implements OnApplicationShutdown {
  private readonly kafka = new Kafka({
    brokers: [process.env.KAFKA_BROKER]
  });

  private readonly consumers = [];

  async consume(topic: string, config: ConsumerRunConfig) {
    const consumer = this.kafka.consumer({
      groupId: process.env.KAFKA_GROUP
    });
    await consumer.connect();
    await consumer.subscribe({
      topic
    });
    await consumer.run(config);
    this.consumers.push(consumer);
  }

  async onApplicationShutdown() {
    for (const consumer of this.consumers) {
      await consumer.disconnect();
    }
  }
}
