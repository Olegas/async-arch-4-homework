import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Repository } from 'typeorm';
import { hashPassword } from '../lib/password';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>
  ) {}

  async login(login: string, password: string): Promise<User | false> {
    const user = await this.usersRepository.findOneBy({
      login
    });
    if (!user) {
      return false;
    }
    const key = await hashPassword(password);
    if (user.password === key) {
      return user;
    }
    return false;
  }
}
