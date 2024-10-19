import {
  Column,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Transfer } from '../transfers/transfers.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ unique: true })
  username: string;

  @Column({ unique: true })
  email: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ select: false })
  password: string;

  // not so certain about this, since it's going to get cached
  @Index()
  @Column('decimal', { precision: 10, scale: 2, default: 0.0 })
  balance: number;

  @OneToMany(() => Transfer, (transfer) => transfer.fromUser)
  sentTransfers: Transfer[];

  @OneToMany(() => Transfer, (transfer) => transfer.toUser)
  receivedTransfers: Transfer[];
}
