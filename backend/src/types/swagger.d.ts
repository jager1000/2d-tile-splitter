declare module 'swagger-ui-express' {
  import { RequestHandler } from 'express';
  export const serve: RequestHandler;
  export function setup(swaggerDoc: object, options?: object): RequestHandler;
}

declare module 'swagger-jsdoc' {
  export interface SwaggerOptions {
    definition: object;
    apis: string[];
  }
  export interface SwaggerSpec {
    openapi: string;
    info: object;
    paths?: object;
    components?: object;
    [key: string]: unknown;
  }
  export default function swaggerJsdoc(options: SwaggerOptions): SwaggerSpec;
}
