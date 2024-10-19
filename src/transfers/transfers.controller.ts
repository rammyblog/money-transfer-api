import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Request,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';

import { FilterTransfersDTO, TransferMoneyDto } from './transfer-money.dto';
import { TransfersService } from './transfers.service';

@Controller('transfers')
export class TransfersController {
  constructor(private readonly transfersService: TransfersService) {}
  @Post()
  async createTransfer(
    @Body()
    transferDto: TransferMoneyDto,
    @Request() req,
  ) {
    const { username } = req.user;
    return this.transfersService.transferMoney(transferDto, username);
  }

  @Get(':id')
  async getTransfer(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.transfersService.getTransfer(id, req.user.userId);
  }

  @Get()
  @UsePipes(new ValidationPipe({ transform: true }))
  async getTransfers(
    @Request() req,
    @Query() filterTransfersDto: FilterTransfersDTO,
  ) {
    const filter: FilterTransfersDTO = {
      ...filterTransfersDto,
      fromUser: req.user,
    };
    return this.transfersService.filterTransfers(filter);
  }
}
