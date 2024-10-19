import { CacheModule } from '@nestjs/cache-manager';
import { CacheStore, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { redisStore } from 'cache-manager-redis-yet';
import { AuthModule } from './auth/auth.module';
import { Transfer } from './transfers/transfers.entity';
import { TransfersModule } from './transfers/transfers.module';
import { User } from './users/user.entity';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    CacheModule.registerAsync({
      useFactory: async () => {
        const store = await redisStore({
          socket: {
            host: process.env.REDIS_HOST,
            port: parseInt(process.env.REDIS_PORT, 10),
          },
        });

        return {
          store: store as unknown as CacheStore,
          ttl: 5 * 60000,
        };
      },
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT, 10),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      entities: [User, Transfer],
      synchronize: true, // For dev only. To be diabled in PROD
    }),
    AuthModule,
    UsersModule,
    TransfersModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
