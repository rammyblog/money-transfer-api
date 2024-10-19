import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, EntityManager } from 'typeorm';
import { User } from '../users/user.entity';
import { TransferMoneyDto } from './transfer-money.dto';
import { Transfer } from './transfers.entity';
import { TransfersService } from './transfers.service';

type MockRepository = {
  create: jest.Mock;
  save: jest.Mock;
  createQueryBuilder: jest.Mock;
};

const mockDataSource = {
  transaction: jest
    .fn()
    .mockImplementation(
      async <T>(
        runInTransaction: (manager: EntityManager) => Promise<T>,
      ): Promise<T> => {
        const mockEntityManager = {
          findOne: jest.fn(),
          save: jest.fn(),
        };
        return runInTransaction(mockEntityManager as unknown as EntityManager);
      },
    ),
} as unknown as DataSource;

const mockTransferRepository = (): MockRepository => ({
  create: jest.fn(),
  save: jest.fn(),
  createQueryBuilder: jest.fn(),
});

describe('TransfersService', () => {
  let service: TransfersService;
  let transferRepository: MockRepository;
  let dataSource: DataSource;
  let cacheManager: jest.Mocked<Cache>;

  beforeEach(async () => {
    const mockCacheManager = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransfersService,
        {
          provide: getRepositoryToken(Transfer),
          useFactory: mockTransferRepository,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    service = module.get<TransfersService>(TransfersService);
    transferRepository = module.get(getRepositoryToken(Transfer));
    dataSource = module.get<DataSource>(DataSource);
    cacheManager = module.get<Cache>(CACHE_MANAGER) as jest.Mocked<Cache>;
  });

  it('should transfer money successfully', async () => {
    const transferDto: TransferMoneyDto = {
      toUser: 'recipient',
      amount: 100,
    };

    const mockSender: User = {
      id: 1,
      username: 'sender',
      balance: 500,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      password: 'hashedPassword',
      sentTransfers: [],
      receivedTransfers: [],
    };

    const mockRecipient: User = {
      id: 2,
      username: 'recipient',
      balance: 100,
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane@example.com',
      password: 'hashedPassword',
      sentTransfers: [],
      receivedTransfers: [],
    };

    const mockTransfer: Transfer = {
      id: 1,
      fromUser: mockSender,
      toUser: mockRecipient,
      amount: 100,
      createdAt: new Date(),
    };

    jest.spyOn(dataSource, 'transaction').mockResolvedValueOnce(mockTransfer);

    const result = await service.transferMoney(transferDto, 'sender');

    expect(result.fromUser).toEqual({
      id: 1,
      username: 'sender',
      firstName: 'John',
      lastName: 'Doe',
      sentTransfers: [],
      receivedTransfers: [],
      email: 'john@example.com',
      password: 'hashedPassword',
      balance: 500,
    });
    expect(result.toUser).toEqual({
      id: 2,
      username: 'recipient',
      firstName: 'Jane',
      sentTransfers: [],
      receivedTransfers: [],
      lastName: 'Doe',
      email: 'jane@example.com',
      balance: 100,
      password: 'hashedPassword',
    });
    expect(result.amount).toBe(100);
  });
});
