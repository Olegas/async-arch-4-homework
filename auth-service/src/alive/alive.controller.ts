import { Controller, Get } from '@nestjs/common';

@Controller('alive')
export class AliveController {
  @Get()
  alive() {
    return 'alive';
  }
}
