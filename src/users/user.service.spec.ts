import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as argon2 from 'argon2';
import { Repository } from 'typeorm';
import { CreateUserDto } from './create-user.dto';
import { User } from './user.entity';
import { UsersService } from './users.service';

type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

const createMockRepository = (): MockRepository<User> => ({
  findOneBy: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
});

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: MockRepository<User>;
  let cacheManager: jest.Mocked<Cache>;

  beforeEach(async () => {
    const mockCacheManager = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useFactory: createMockRepository,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepository = module.get<MockRepository<User>>(getRepositoryToken(User));
    cacheManager = module.get<Cache>(CACHE_MANAGER) as jest.Mocked<Cache>;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a user and hash the password', async () => {
      const createUserDto: CreateUserDto = {
        username: 'john_doe',
        email: 'john@example.com',
        password: 'pass123',
        firstName: 'John',
        lastName: 'Doe',
      };

      const mockUser: Partial<User> = {
        id: 1,
        ...createUserDto,
        password: 'hashedPassword',
        balance: 100.0,
      };

      userRepository.findOneBy.mockResolvedValueOnce(null);
      userRepository.findOneBy.mockResolvedValueOnce(null);
      userRepository.create.mockReturnValue(mockUser);
      userRepository.save.mockResolvedValue(mockUser);

      jest.spyOn(argon2, 'hash').mockResolvedValue('hashedPassword');

      const result = await service.create(createUserDto);

      expect(argon2.hash).toHaveBeenCalledWith('pass123');
      expect(userRepository.create).toHaveBeenCalledWith({
        ...createUserDto,
        password: 'hashedPassword',
        balance: 100.0,
      });
      expect(userRepository.save).toHaveBeenCalled();
      expect(result).toMatchObject({
        id: 1,
        username: 'john_doe',
        email: 'john@example.com',
        firstName: 'John',
        lastName: 'Doe',
        balance: 100.0,
      });
    });

    it('should throw ConflictException if username already exists', async () => {
      const createUserDto: CreateUserDto = {
        username: 'john_doe',
        email: 'john@example.com',
        password: 'pass123',
        firstName: 'John',
        lastName: 'Doe',
      };

      userRepository.findOneBy.mockResolvedValueOnce({
        id: 1,
        username: 'john_doe',
      } as User);

      await expect(service.create(createUserDto)).rejects.toThrow(
        ConflictException,
      );
      expect(userRepository.create).not.toHaveBeenCalled();
      expect(userRepository.save).not.toHaveBeenCalled();
    });

    it('should throw ConflictException if email is already taken', async () => {
      const createUserDto: CreateUserDto = {
        username: 'john_doe',
        email: 'john@example.com',
        password: 'pass123',
        firstName: 'John',
        lastName: 'Doe',
      };

      userRepository.findOneBy.mockResolvedValueOnce(null);
      userRepository.findOneBy.mockResolvedValueOnce({
        id: 1,
        email: 'john@example.com',
      } as User);

      await expect(service.create(createUserDto)).rejects.toThrow(
        ConflictException,
      );
      expect(userRepository.create).not.toHaveBeenCalled();
      expect(userRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('findOneById', () => {
    it('should return user without password', async () => {
      const mockUser: Partial<User> = {
        id: 1,
        username: 'john_doe',
        email: 'john@example.com',
        firstName: 'John',
        lastName: 'Doe',
        password: 'hashedPassword',
        balance: 100,
      };

      userRepository.findOneBy.mockResolvedValue(mockUser as User);

      const result = await service.findOneById(1);
      expect(userRepository.findOneBy).toHaveBeenCalledWith({ id: 1 });
      expect(result).toEqual(
        expect.objectContaining({
          id: 1,
          username: 'john_doe',
          email: 'john@example.com',
          firstName: 'John',
          lastName: 'Doe',
        }),
      );
      expect(result).not.toHaveProperty('password');
    });

    it('should throw NotFoundException if user is not found', async () => {
      userRepository.findOneBy.mockResolvedValue(null);

      await expect(service.findOneById(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOneByIdOrUsername', () => {
    it('should return user by id', async () => {
      const mockUser: Partial<User> = {
        id: 1,
        username: 'john_doe',
        email: 'john@example.com',
        firstName: 'John',
        lastName: 'Doe',
      };

      userRepository.findOneBy.mockResolvedValue(mockUser as User);

      const result = await service.findOneByIdOrUsername(1);
      expect(result).toEqual(mockUser);
    });

    it('should return user by username', async () => {
      const mockUser: Partial<User> = {
        id: 1,
        username: 'john_doe',
        email: 'john@example.com',
        firstName: 'John',
        lastName: 'Doe',
        balance: 100,
      };

      userRepository.findOneBy.mockResolvedValue(mockUser as User);

      const result = await service.findOneByIdOrUsername('john_doe');
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException if user is not found', async () => {
      userRepository.findOneBy.mockResolvedValue(null);

      await expect(service.findOneByIdOrUsername(1)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
