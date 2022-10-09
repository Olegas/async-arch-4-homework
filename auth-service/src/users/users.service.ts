import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { UpdateResult } from 'typeorm/query-builder/result/UpdateResult';
import { hashPassword } from '../lib/password';
import { ProducerService } from '../kafka/producer.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private producer: ProducerService
  ) {}

  async create(createUserDto: CreateUserDto) {
    const { password } = createUserDto;
    const key = await hashPassword(password);
    const data: CreateUserDto = {
      ...createUserDto,
      password: key
    };
    const result = await this.usersRepository.save(data);
    await this.producer.produce('users-streaming', {
      message: 'user-created',
      data: {
        name: result.name,
        role: result.role,
        uuid: result.uuid
      }
    });
    return result;
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
    await this.producer.produce('users-streaming', {
      message: 'user-updated',
      data: {
        role: updateUserDto.role,
        uuid: user.uuid
      }
    });
    return result;
  }

  async remove(id: number): Promise<void> {
    const user = await this.usersRepository.findOneBy({ id });
    await this.usersRepository.delete(id);
    await this.producer.produce('users-streaming', {
      message: 'user-deleted',
      data: {
        uuid: user.uuid
      }
    });
  }
}
