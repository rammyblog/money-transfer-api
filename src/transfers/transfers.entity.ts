import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

@Entity()
export class Transfer {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.sentTransfers)
  @Index()
  @JoinColumn({ name: 'from_user_id' })
  fromUser: User;

  @ManyToOne(() => User, (user) => user.receivedTransfers)
  @JoinColumn({ name: 'to_user_id' })
  toUser: User;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @CreateDateColumn()
  @Index()
  createdAt: Date;
}
