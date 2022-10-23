import { Module } from '@nestjs/common';
import { SchemaService } from './schema.service';

@Module({
  exports: [SchemaService],
  providers: [SchemaService]
})
export class SchemaModule {}
