import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as argon2 from 'argon2';
import { Repository } from 'typeorm';
import { CreateUserDto } from './create-user.dto';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  /**
   * Creates a new user, hashing the password and checking for existing users by username and email.
   *
   * @param {CreateUserDto} payload - The DTO containing user information (username, email, password, etc.).
   * @returns {Promise<User>} - The newly created user.
   * @throws {ConflictException} - If the username or email already exists.
   */
  async create(payload: CreateUserDto): Promise<User> {
    const existingUser = await this.userRepository.findOneBy({
      username: payload.username,
    });

    const existingEmail = await this.userRepository.findOneBy({
      email: payload.email,
    });

    if (existingUser) {
      throw new ConflictException('Username already exists');
    }

    if (existingEmail) {
      throw new ConflictException('Email already taken');
    }

    const hashedPassword = await argon2.hash(payload.password);
    const user = this.userRepository.create({
      ...payload,
      password: hashedPassword,
      balance: 100.0, // to have money
    });
    await this.userRepository.save(user);
    return user;
  }

  /**
   * Finds a user by their ID, excluding the balance field from the returned data.
   *
   * @param {number} id - The ID of the user to retrieve.
   * @returns {Promise<Omit<User, 'balance'>>} - The user details without the balance.
   * @throws {NotFoundException} - If the user is not found.
   */
  async findOneById(id: number): Promise<Omit<User, 'balance'>> {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const { balance, ...rest } = user;
    return rest;
  }

  /**
   * Finds a user by either their ID or username, excluding the balance and password fields.
   *
   * @param {string | number} usernameOrId - The username or ID of the user.
   * @returns {Promise<Omit<User, 'balance' | 'password'>>} - The user details without the balance and password.
   * @throws {Error} - If the user is not found.
   */
  async findOneByIdOrUsername(
    usernameOrId: string | number,
  ): Promise<Omit<User, 'balance' | 'password'>> {
    let user: Omit<User, 'balance' | 'password'>;

    const id = parseInt(usernameOrId as string, 10);
    if (!isNaN(id)) {
      user = await this.findOneById(id);
    } else if (typeof usernameOrId === 'string') {
      user = await this.findOneByUsername(usernameOrId);
    }

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  /**
   * Finds a user by their username and caches the result. The password is excluded from the result.
   *
   * @param {string} username - The username of the user to retrieve.
   * @returns {Promise<Omit<User, 'password'>>} - The user details without the password.
   * @throws {NotFoundException} - If the user is not found.
   */
  async findOneByUsername(username: string): Promise<Omit<User, 'password'>> {
    const value = await this.cacheManager.get<Omit<User, 'password'>>(username);
    if (value) {
      return value;
    }

    const user = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.sentTransfers', 'sentTransfers')
      .leftJoinAndSelect('sentTransfers.toUser', 'toUser')
      .leftJoinAndSelect('user.receivedTransfers', 'receivedTransfers')
      .leftJoinAndSelect('receivedTransfers.fromUser', 'fromUser')
      .where('user.username = :username', { username })
      .select([
        'user',
        'sentTransfers',
        'toUser.id',
        'toUser.username',
        'receivedTransfers',
        'fromUser.id',
        'fromUser.username',
      ])
      .getOne();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.cacheManager.set(username, user);
    return user;
  }

  /**
   * Finds a user by their username, including their password.
   *
   * @param {string} username - The username of the user to retrieve.
   * @returns {Promise<User>} - The user details including the password.
   * @throws {NotFoundException} - If the user is not found.
   */
  async findUser(username: string): Promise<User> {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.username = :username', { username })
      .getOne();

    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }
}
