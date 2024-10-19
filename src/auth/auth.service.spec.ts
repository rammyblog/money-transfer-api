import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as argon2 from 'argon2';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

jest.mock('argon2');

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;

  const mockUser = {
    id: 1,
    username: 'testuser',
    password: 'hashedPassword',
    email: 'test@example.com',
    balance: 100,
    firstName: 'Tunde',
    lastName: 'Leke',
    createdAt: new Date(),
    sentTransfers: [],
    receivedTransfers: [],
  };

  beforeEach(async () => {
    const mockUsersService = {
      findUser: jest.fn(),
    };

    const mockJwtService = {
      sign: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateUser', () => {
    it('should return user object without password when credentials are valid', async () => {
      const username = 'testuser';
      const password = 'correctPassword';

      usersService.findUser.mockResolvedValue(mockUser);
      (argon2.verify as jest.Mock).mockResolvedValue(true);

      const result = await authService.validateUser(username, password);

      expect(result).toEqual({
        id: mockUser.id,
        username: mockUser.username,
        email: mockUser.email,
        balance: mockUser.balance,
        createdAt: mockUser.createdAt,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        sentTransfers: [],
        receivedTransfers: [],
      });
      expect(usersService.findUser).toHaveBeenCalledWith(username);
      expect(argon2.verify).toHaveBeenCalledWith(mockUser.password, password);
    });

    it('should throw BadRequestException when password is invalid', async () => {
      const username = 'testuser';
      const password = 'wrongPassword';

      usersService.findUser.mockResolvedValue(mockUser);
      (argon2.verify as jest.Mock).mockResolvedValue(false);

      await expect(
        authService.validateUser(username, password),
      ).rejects.toThrow(BadRequestException);

      expect(usersService.findUser).toHaveBeenCalledWith(username);
      expect(argon2.verify).toHaveBeenCalledWith(mockUser.password, password);
    });

    it('should return null when user is not found', async () => {
      const username = 'nonexistentuser';
      const password = 'somepassword';

      usersService.findUser.mockResolvedValue(null);

      expect(authService.validateUser(username, password)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('login', () => {
    it('should return JWT token when login is successful', async () => {
      const user = {
        id: 1,
        username: 'testuser',
      };

      const mockToken = 'jwt-token';
      const mockSecret = 'test-secret';

      jwtService.sign.mockReturnValue(mockToken);
      configService.get.mockReturnValue(mockSecret);

      const result = await authService.login(user);

      expect(result).toEqual({
        access_token: mockToken,
      });
      expect(jwtService.sign).toHaveBeenCalledWith(
        { username: user.username, sub: user.id },
        { secret: mockSecret, expiresIn: '50m' },
      );
      expect(configService.get).toHaveBeenCalledWith('JWT_SECRET');
    });
  });
});
