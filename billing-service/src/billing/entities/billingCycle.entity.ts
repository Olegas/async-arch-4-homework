import {
  Column,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity()
export class BillingCycle {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  active: boolean;

  @Column({ type: 'date' })
  from: string;

  @Column({ type: 'date' })
  to: string;

  @ManyToOne(() => User)
  @Index({ unique: true, where: 'active IS TRUE' })
  user: User;
}
