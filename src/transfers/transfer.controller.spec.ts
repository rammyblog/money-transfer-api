import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { FilterTransfersDTO, TransferMoneyDto } from './transfer-money.dto';
import { TransfersController } from './transfers.controller';
import { TransfersService } from './transfers.service';

const mockTransfersService = () => ({
  transferMoney: jest.fn().mockImplementation(),
  filterTransfers: jest.fn().mockImplementation(),
});

describe('TransfersController', () => {
  let controller: TransfersController;
  let service: jest.Mocked<TransfersService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransfersController],
      providers: [
        {
          provide: TransfersService,
          useFactory: mockTransfersService,
        },
      ],
    }).compile();

    controller = module.get<TransfersController>(TransfersController);
    service = module.get(TransfersService) as jest.Mocked<TransfersService>;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createTransfer', () => {
    it('should create a transfer successfully', async () => {
      const transferDto: TransferMoneyDto = {
        toUser: 'tunde',
        amount: 100,
      };

      const mockResponse = {
        id: 1,
        fromUser: {
          id: 6,
          username: 'tunde12',
          email: 'tunde12@dev.com',
          firstName: 'Tunde',
          lastName: 'Onasanya',
          balance: 0,
          sentTransfers: [],
          receivedTransfers: [],
        },
        toUser: {
          id: 2,
          username: 'tunde',
          email: 'tunde@dev.com',
          firstName: 'Tunde',
          lastName: 'Onasanya',
          sentTransfers: [],
          receivedTransfers: [],
        },
        amount: 100,
        createdAt: new Date(),
      };

      jest.spyOn(service, 'transferMoney').mockResolvedValueOnce(mockResponse);

      const req = { user: { username: 'john_doe' } };
      const result = await controller.createTransfer(transferDto, req);

      expect(result).toEqual(mockResponse);
      expect(service.transferMoney).toHaveBeenCalledWith(
        transferDto,
        req.user.username,
      );
    });

    it('should throw ConflictException when transfer cannot be processed', async () => {
      const transferDto: TransferMoneyDto = {
        toUser: 'tunde',
        amount: 100,
      };

      jest
        .spyOn(service, 'transferMoney')
        .mockRejectedValueOnce(
          new ConflictException('Transfer could not be processed'),
        );

      const req = { user: { username: 'john_doe' } };
      await expect(controller.createTransfer(transferDto, req)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('getTransfers', () => {
    it('should return a list of transfers for the user', async () => {
      const filterDto: FilterTransfersDTO = {
        toUserId: 2,
        minAmount: 50,
        maxAmount: 150,
        limit: 1,
        page: 1,
      };

      const mockTransfers = {
        transfers: [
          {
            id: 1,
            toUser: {
              id: 2,
              username: 'tunde',
              firstName: 'tunde',
              lastName: 'rammy',
            },
            amount: 100,
            createdAt: new Date(),
          },
        ],
        meta: {
          total: 1,
          page: 1,
          limit: 1,
          totalPages: 1,
        },
      };

      jest
        .spyOn(service, 'filterTransfers')
        .mockResolvedValueOnce(mockTransfers);

      const req = { user: { username: 'john_doe' } };
      const result = await controller.getTransfers(req, filterDto);

      expect(result).toEqual(mockTransfers);
      expect(service.filterTransfers).toHaveBeenCalledWith({
        ...filterDto,
        fromUser: req.user,
      });
    });

    it('should throw NotFoundException when no transfers are found', async () => {
      jest
        .spyOn(service, 'filterTransfers')
        .mockRejectedValueOnce(new NotFoundException('No transfers found'));

      const req = { user: { username: 'john_doe' } };
      const filterDto: FilterTransfersDTO = { toUserId: 2, limit: 1, page: 1 };

      await expect(controller.getTransfers(req, filterDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
