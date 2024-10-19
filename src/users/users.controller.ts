import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { IsAccountOwner, Public } from '../auth/auth.decorator';
import { CreateUserDto } from './create-user.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}
  @Post()
  @Public()
  async createUser(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Get(':usernameOrId')
  async getUserByIdOrUsername(
    @IsAccountOwner() user: any,
    @Param('usernameOrId') usernameOrId: string | number,
  ) {
    return this.usersService.findOneByIdOrUsername(usernameOrId);
  }
}
