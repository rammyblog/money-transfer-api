import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private config: ConfigService,
  ) {}

  /**
   * Validates the user credentials (username and password).
   *
   * @param {string} username - The username of the user to validate.
   * @param {string} pass - The plaintext password to verify.
   * @returns {Promise<any>} - The validated user without the password field, or null if invalid.
   * @throws {BadRequestException} - If the email or password is incorrect.
   */
  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.usersService.findUser(username);
    if (!user) {
      throw new BadRequestException('Invalid email/password');
    }
    const passwordValid = await argon2.verify(user.password, pass);
    if (!passwordValid) {
      throw new BadRequestException('Invalid email/password');
    }
    if (user) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  /**
   * Logs in the user by generating a JWT token.
   *
   * @param {any} user - The user object.
   * @returns {Promise<{ access_token: string }>} - The generated JWT access token.
   */
  async login(user: any): Promise<{ access_token: string }> {
    const payload = { username: user.username, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload, {
        secret: this.config.get('JWT_SECRET'),
        expiresIn: '50m',
      }),
    };
  }
}
