import { HttpStatus, Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import fetch from 'node-fetch';
import { UsersService } from './users/users.service';

@Injectable()
export class AuthzMiddleware implements NestMiddleware {
  constructor(private readonly usersService: UsersService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const token = (req.header('Authorization') || '').replace('Bearer ', '');
    if (token) {
      const verifyResponse = await fetch(
        `http://${process.env.AUTH_SERVICE_HOSTNAME}/auth/verify/${token}`
      );
      if (verifyResponse.status === 200) {
        const { id } = await verifyResponse.json();
        if (id) {
          const user = await this.usersService.findOne(id);
          if (user) {
            res.locals.currentUser = user;
            return next();
          }
        }
      }
    }
    res.status(HttpStatus.FORBIDDEN).end();
  }
}
