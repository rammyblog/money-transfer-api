import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CreateUserDto } from './create-user.dto';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

const mockUsersService = () => ({
  create: jest.fn().mockImplementation(),
  findOneByIdOrUsername: jest.fn().mockImplementation(),
});

describe('UsersController', () => {
  let controller: UsersController;
  let service: jest.Mocked<UsersService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useFactory: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get(UsersService) as jest.Mocked<UsersService>;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createUser', () => {
    it('should create a user', async () => {
      const createUserDto: CreateUserDto = {
        username: 'john_doe',
        password: 'pass123',
        email: 'tunde@gmail.com',
        firstName: 'Tunde',
        lastName: 'Leke',
      };

      const mockUser = {
        id: 1,
        username: createUserDto.username,
        email: createUserDto.email,
        firstName: createUserDto.firstName,
        lastName: createUserDto.lastName,
        balance: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
        sentTransfers: [],
        receivedTransfers: [],
      };

      jest.spyOn(service, 'create').mockResolvedValueOnce(mockUser);

      const result = await controller.createUser(createUserDto);

      expect(result).toEqual(mockUser);
      expect(service.create).toHaveBeenCalledWith(createUserDto);
    });
    it('should throw ConflictException when username already exists', async () => {
      const createUserDto: CreateUserDto = {
        username: 'existing_user',
        password: 'pass123',
        email: 'existing@gmail.com',
        firstName: 'Existing',
        lastName: 'User',
      };

      jest
        .spyOn(service, 'create')
        .mockRejectedValueOnce(
          new ConflictException('Username already exists'),
        );

      await expect(controller.createUser(createUserDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('getUser', () => {
    it('should return a user by id', async () => {
      const mockUser = {
        id: 1,
        username: 'john_doe',
        balance: 100,
        email: 'tunde@gmail.com',
        firstName: 'Tunde',
        lastName: 'Leke',
        createdAt: new Date(),
        updatedAt: new Date(),
        sentTransfers: [],
        receivedTransfers: [],
      };

      jest
        .spyOn(service, 'findOneByIdOrUsername')
        .mockResolvedValueOnce(mockUser);

      const result = await controller.getUserByIdOrUsername(mockUser, 1);

      expect(result).toEqual(mockUser);
      expect(service.findOneByIdOrUsername).toHaveBeenCalledWith(1);
    });

    it('should return a user by username', async () => {
      const mockUser = {
        id: 1,
        username: 'john_doe',
        balance: 100,
        email: 'tunde@gmail.com',
        firstName: 'Tunde',
        lastName: 'Leke',
        createdAt: new Date(),
        updatedAt: new Date(),
        sentTransfers: [],
        receivedTransfers: [],
      };

      jest
        .spyOn(service, 'findOneByIdOrUsername')
        .mockResolvedValueOnce(mockUser);

      const result = await controller.getUserByIdOrUsername(
        mockUser,
        'john_doe',
      );

      expect(result).toEqual(mockUser);
      expect(service.findOneByIdOrUsername).toHaveBeenCalledWith('john_doe');
    });
    it('should throw NotFoundException when user is not found', async () => {
      jest
        .spyOn(service, 'findOneByIdOrUsername')
        .mockRejectedValueOnce(new NotFoundException('User not found'));

      await expect(controller.getUserByIdOrUsername({}, 999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
