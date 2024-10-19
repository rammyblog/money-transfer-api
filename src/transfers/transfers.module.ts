import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/user.entity';
import { TransfersController } from './transfers.controller';
import { Transfer } from './transfers.entity';
import { TransfersService } from './transfers.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Transfer, User]),
    CacheModule.register({}),
  ],
  providers: [TransfersService],
  exports: [TransfersService],
  controllers: [TransfersController],
})
export class TransfersModule {}
