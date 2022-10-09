import {
  BadRequestException,
  Body,
  Controller,
  NotFoundException,
  Post
} from '@nestjs/common';
import { LoginParams, VerifyParams } from './dto/auth.dto';
import { AuthService } from './auth.service';
import { generateToken, verifyToken } from '../lib/token';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post()
  async login(@Body() params: LoginParams) {
    const result = await this.authService.login(params.login, params.password);
    if (result) {
      const token = await generateToken(result.uuid);
      return {
        token
      };
    }
    throw new NotFoundException();
  }

  @Post('verify')
  async verify(@Body() body: VerifyParams) {
    const { token } = body;
    const decodedData = await verifyToken(token);
    if (decodedData) {
      return decodedData;
    }
    throw new BadRequestException();
  }
}
