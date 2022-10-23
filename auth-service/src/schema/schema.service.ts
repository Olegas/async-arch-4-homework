import { Injectable } from '@nestjs/common';
import fetch from 'node-fetch';
import { Validator } from 'jsonschema';

interface ValidateArgs {
  topic: string;
  event: string;
  version: string;
  payload: Record<string, any>;
}

@Injectable()
export class SchemaService {
  private schemaStore = {};
  private validator = new Validator();

  private createSchemaKey(
    topic: string,
    event: string,
    version: string
  ): string {
    return `${topic}/${event}/v${version}.json`;
  }

  private async loadSchema(key: string) {
    if (this.schemaStore[key]) {
      return this.schemaStore[key];
    }
    const response = await fetch(
      `http://${process.env.SCHEMA_SERVICE_HOSTNAME}/${key}`
    );
    if (response.status === 200) {
      const schema = await response.json();
      this.schemaStore[key] = schema;
      return schema;
    }
    return null;
  }

  async validateSchema({
    topic,
    event,
    version,
    payload
  }: ValidateArgs): Promise<boolean> {
    const key = this.createSchemaKey(topic, event, version);
    const schema = await this.loadSchema(key);
    if (schema) {
      const result = this.validator.validate(payload, schema);
      console.log(result);
      return result.valid;
    }
    return false;
  }
}
