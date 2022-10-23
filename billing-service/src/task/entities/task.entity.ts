import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Task {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    unique: true
  })
  uuid: string;

  @Column()
  title: string;

  @Column({ nullable: true })
  jiraId: string;

  @Column({
    type: 'numeric',
    precision: 2
  })
  priceAssign: number;

  @Column({
    type: 'numeric',
    precision: 2
  })
  priceComplete: number;
}
