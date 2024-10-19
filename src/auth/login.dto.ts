import { IsNotEmpty, IsString, Length } from 'class-validator';

export class LoginDto {
  @IsNotEmpty()
  username: string;
  @Length(3, 20)
  @IsNotEmpty()
  @IsString()
  password: string;
}
