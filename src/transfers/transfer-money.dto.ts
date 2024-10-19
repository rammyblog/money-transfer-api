import { Type } from 'class-transformer';
import {
  IsDate,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { IsLessThanOrEqual, IsOneOf } from './validator';

export class TransferMoneyDto {
  @IsString()
  toUser: string;

  @IsNumber()
  @Min(0.01)
  @Type(() => Number)
  amount: number;
}

class FromUserDTO {
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  userId: number;

  @IsString()
  username: string;
}

export class FilterTransfersDTO {
  @IsOptional()
  @ValidateNested()
  @Type(() => FromUserDTO)
  fromUser?: FromUserDTO;

  @IsOptional()
  @IsString()
  @IsOneOf(['toUserName', 'toUserId'], {
    message: 'Provide either toUserName or toUserId',
  })
  toUserName?: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  toUserId?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  minAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @IsLessThanOrEqual('minAmount', 'maxAmount', {
    message: 'maxAmount must be greater than or equal to minAmount.',
  })
  maxAmount?: number;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startDate?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  @IsLessThanOrEqual('startDate', 'endDate', {
    message: 'endDate must be greater than or equal to startDate.',
  })
  endDate?: Date;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  limit = 10;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page = 1;
}
