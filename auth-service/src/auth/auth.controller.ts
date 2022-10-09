import { Body, Controller, Get, HttpStatus, Post, Res } from '@nestjs/common';
import { LoginParams, VerifyParams } from './dto/auth.dto';
import { AuthService } from './auth.service';
import { Response } from 'express';
import { generateToken, verifyToken } from '../lib/token';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post()
  async login(@Body() params: LoginParams, @Res() res: Response) {
    const result = await this.authService.login(params.login, params.password);
    if (result) {
      const token = await generateToken(result.uuid);
      return res
        .status(HttpStatus.OK)
        .header('content-type', 'application/json')
        .send(
          JSON.stringify({
            token
          })
        );
    }
    return res.status(HttpStatus.NOT_FOUND).send();
  }

  @Post('verify')
  async verify(@Body() body: VerifyParams, @Res() res: Response) {
    const { token } = body;
    const decodedData = await verifyToken(token);
    if (decodedData) {
      return res
        .status(HttpStatus.OK)
        .header('content-type', 'application/json')
        .send(JSON.stringify(decodedData));
    }
    res.status(HttpStatus.BAD_REQUEST).send();
  }
}
