import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { UpdateResult } from 'typeorm/query-builder/result/UpdateResult';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>
  ) {}

  async create(createUserDto: CreateUserDto) {
    return this.usersRepository.upsert(createUserDto, ['uuid']);
  }

  async pickRandomUser(): Promise<[number, string] | null> {
    const allUsers = await this.usersRepository.query(
      `SELECT *
         FROM public.user
        WHERE role != 'admin'
          AND role != 'manager'`
    );
    if (allUsers && allUsers.length > 0) {
      const count = allUsers.length;
      const user = allUsers[(Math.random() * (count - 1)) >> 0];
      const { id, uuid } = user;
      return [id, uuid];
    }
    return null;
  }

  findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  findOne(uuid: string): Promise<User> {
    return this.usersRepository.findOneBy({ uuid });
  }

  async updateByUUID(
    uuid: string,
    updateUserDto: UpdateUserDto
  ): Promise<UpdateResult> {
    return this.usersRepository.update(
      { uuid },
      // We can update only role
      {
        role: updateUserDto.role
      }
    );
  }

  async remove(id: number): Promise<void> {
    await this.usersRepository.delete(id);
  }

  async removeByUuid(uuid: string): Promise<void> {
    await this.usersRepository.delete({
      uuid
    });
  }
}
