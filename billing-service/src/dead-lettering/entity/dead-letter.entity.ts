import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn
} from 'typeorm';

@Entity()
export class DeadLetter {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  event: string;

  @CreateDateColumn()
  createdAt: string;
}
