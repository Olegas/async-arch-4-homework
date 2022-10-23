import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Task } from '../../task/entities/task.entity';
import { BillingCycle } from './billingCycle.entity';

export enum Operation {
  deposit = 'deposit',
  withdraw = 'withdraw',
  payment = 'payment'
}

@Entity()
export class Transaction {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User)
  user: User;

  @CreateDateColumn()
  createdAt: string;

  @Column({
    default: 0,
    type: 'money'
  })
  income: number;

  @Column({
    default: 0,
    type: 'money'
  })
  outcome: number;

  @Column({
    type: 'enum',
    enum: Operation
  })
  operation: string;

  @ManyToOne(() => BillingCycle)
  billingCycle: BillingCycle;

  @ManyToOne(() => Task)
  task: Task;
}
