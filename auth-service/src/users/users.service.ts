import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { DataSource, Repository } from 'typeorm';
import { UpdateResult } from 'typeorm/query-builder/result/UpdateResult';
import { hashPassword } from '../lib/password';
import { ProducerService } from '../kafka/producer.service';
import { SchemaService } from '../schema/schema.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private producer: ProducerService,
    private validator: SchemaService,
    private dataSource: DataSource
  ) {}

  async create(createUserDto: CreateUserDto) {
    const { password } = createUserDto;
    const key = await hashPassword(password);
    const data: CreateUserDto = {
      ...createUserDto,
      password: key
    };
    return this.dataSource.transaction(async (manager) => {
      const result = await manager.save(User, data);
      const payload = {
        name: result.name,
        role: result.role,
        uuid: result.uuid
      };
      const event = {
        topic: 'users-streaming',
        event: 'created',
        version: '1',
        payload
      };
      const isValid = await this.validator.validateSchema(event);
      if (!isValid) {
        throw new Error('Incorrect schema');
      }

      await this.producer.produce(event);
      return result;
    });
  }

  findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  findOne(id: number): Promise<User> {
    return this.usersRepository.findOneBy({ id });
  }

  async update(
    id: number,
    updateUserDto: UpdateUserDto
  ): Promise<UpdateResult> {
    const user = await this.usersRepository.findOneBy({ id });
    const result = await this.usersRepository.update(
      { id },
      // We can update only role
      {
        role: updateUserDto.role
      }
    );
    const payload = {
      role: updateUserDto.role,
      uuid: user.uuid
    };
    const event = {
      topic: 'users-streaming',
      event: 'updated',
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

  async remove(id: number): Promise<void> {
    const user = await this.usersRepository.findOneBy({ id });
    await this.usersRepository.delete(id);
    const payload = {
      uuid: user.uuid
    };
    const event = {
      topic: 'users-streaming',
      event: 'deleted',
      version: '1',
      payload
    };
    const isValid = await this.validator.validateSchema(event);
    if (!isValid) {
      throw new Error('Incorrect schema');
    }
    await this.producer.produce(event);
  }
}
