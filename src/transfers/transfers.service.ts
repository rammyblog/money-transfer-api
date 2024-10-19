import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { FilterTransfersDTO, TransferMoneyDto } from './transfer-money.dto';
import { Transfer } from './transfers.entity';

@Injectable()
export class TransfersService {
  constructor(
    @InjectRepository(Transfer)
    private readonly transferRepository: Repository<Transfer>,
    private readonly dataSource: DataSource,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  /**
   * Transfers money from one user to another.
   *
   * @param {TransferMoneyDto} transferDto - The DTO containing transfer information (amount and recipient).
   * @param {string} username - The username of the sender initiating the transfer.
   * @returns {Promise<any>} The result of the transfer, containing details about the sender, recipient, and transfer.
   * @throws {BadRequestException} If the transfer amount is less than or equal to zero, or if the sender has insufficient funds.
   * @throws {NotFoundException} If either the sender or recipient cannot be found.
   */
  async transferMoney(
    transferDto: TransferMoneyDto,
    username: string,
  ): Promise<any> {
    const { amount, toUser } = transferDto;
    if (amount <= 0) {
      throw new BadRequestException(
        'Transfer amount must be greater than zero',
      );
    }

    return this.dataSource.transaction(async (manager) => {
      const sender = await manager.findOne(User, {
        where: { username },
        lock: { mode: 'pessimistic_write' },
      });
      const recipient = await manager.findOne(User, {
        where: { username: toUser },
        lock: { mode: 'pessimistic_write' },
      });

      if (!sender || !recipient) {
        throw new NotFoundException('Sender or recipient not found');
      }

      if (sender.balance < amount) {
        throw new BadRequestException('Insufficient funds');
      }

      if (sender.id === recipient.id) {
        throw new BadRequestException('Cannot transfer to yourself');
      }
      sender.balance = Number(sender.balance) - amount;
      recipient.balance = Number(recipient.balance) + amount;

      await manager.save(User, [sender, recipient]);

      const transfer = this.transferRepository.create({
        fromUser: sender,
        toUser: recipient,
        amount,
      });
      await manager.save(Transfer, transfer);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: senderPassword, ...sanitizedSender } = sender;
      const {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        password: recipientPassword,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        balance: recipientBalance,
        ...sanitizedRecipient
      } = recipient;

      await this.cacheManager.del(sender.username);
      await this.cacheManager.del(recipient.username);

      return {
        ...transfer,
        fromUser: sanitizedSender,
        toUser: sanitizedRecipient,
      };
    });
  }

  /**
   * Retrieves a transfer by its ID and verifies if the transfer belongs to the user.
   *
   * @param {number} id - The ID of the transfer.
   * @param {number} userId - The ID of the user initiating the request.
   * @returns {Promise<Transfer>} The transfer details, including fromUser and toUser.
   * @throws {NotFoundException} If the transfer with the given ID is not found for the specified user.
   */
  async getTransfer(id: number, userId: number): Promise<Transfer> {
    const transfer = await this.transferRepository.findOne({
      where: {
        id,
        fromUser: { id: userId },
      },
      relations: ['fromUser', 'toUser'],
    });

    if (!transfer) {
      throw new NotFoundException(
        `Transfer with ID ${id} not found for user ${userId}`,
      );
    }

    return transfer;
  }

  /**
   * Filters and retrieves a list of transfers based on the given filters.
   *
   * @param {FilterTransfersDTO} filter - The DTO containing filtering options such as fromUser, toUserName, minAmount, maxAmount, and date ranges.
   * @returns {Promise<{ transfers: any[], meta: { total: number, page: number, limit: number, totalPages: number } }>} A paginated list of transfers and metadata.
   */
  async filterTransfers(filter: FilterTransfersDTO): Promise<{
    transfers: any[];
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    const {
      fromUser,
      toUserName,
      toUserId,
      minAmount,
      maxAmount,
      startDate,
      endDate,
      limit = 10,
      page = 1,
    } = filter;

    const { userId } = fromUser;

    const queryBuilder = this.transferRepository
      .createQueryBuilder('transfer')
      .leftJoinAndSelect('transfer.fromUser', 'fromUser')
      .leftJoinAndSelect('transfer.toUser', 'toUser')
      .take(limit)
      .skip((page - 1) * limit)
      .orderBy('transfer.createdAt', 'DESC');

    if (userId) {
      queryBuilder.andWhere('fromUser.id = :userId', { userId });
    }

    if (toUserName) {
      queryBuilder.andWhere('toUser.username = :toUserName', { toUserName });
    }

    if (toUserId) {
      queryBuilder.andWhere('toUser.id = :toUserId', { toUserId });
    }

    if (minAmount) {
      queryBuilder.andWhere('transfer.amount >= :minAmount', { minAmount });
    }

    if (maxAmount) {
      queryBuilder.andWhere('transfer.amount <= :maxAmount', { maxAmount });
    }

    if (startDate) {
      queryBuilder.andWhere('transfer.createdAt >= :startDate', { startDate });
    }

    if (endDate) {
      queryBuilder.andWhere('transfer.createdAt <= :endDate', { endDate });
    }

    const [transfers, total] = await queryBuilder.getManyAndCount();
    const mappedTransfers = transfers.map((transfer) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { fromUser, toUser, ...rest } = transfer;

      return {
        ...rest,
        toUser: {
          id: toUser.id,
          username: toUser.username,
          firstName: toUser.firstName,
          lastName: toUser.lastName,
        },
      };
    });
    return {
      transfers: mappedTransfers,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
