import { Column, Entity, Generated, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Task {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    unique: true
  })
  @Generated('uuid')
  uuid: string;

  @Column()
  title: string;

  @Column({ nullable: true })
  jiraId: string;

  @Column()
  description: string;

  @Column()
  status: string;

  @Column()
  assignee: string;
}
