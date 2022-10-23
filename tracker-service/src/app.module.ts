import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KafkaModule } from './kafka/kafka.module';
import { User } from './users/entities/user.entity';
import { UsersModule } from './users/users.module';
import { TaskModule } from './task/task.module';
import { Task } from './task/entities/task.entity';
import { AuthzMiddleware } from './authz.middleware';
import { SchemaModule } from './schema/schema.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: +(process.env.DB_PORT || 5432),
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME,
      entities: [User, Task],
      synchronize: true
    }),
    KafkaModule,
    UsersModule,
    TaskModule,
    SchemaModule
  ],
  controllers: [],
  providers: []
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthzMiddleware).forRoutes('task');
  }
}
