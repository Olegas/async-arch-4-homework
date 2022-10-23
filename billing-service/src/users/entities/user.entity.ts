import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    unique: true
  })
  uuid: string;

  @Column({
    type: 'money',
    default: 0
  })
  balance: number;
}
