import { Module, Global } from '@nestjs/common';
import { ClsModule as NestClsModule } from 'nestjs-cls';

@Global()
@Module({
  imports: [
    NestClsModule.forRoot({
      global: true,
      middleware: {
        mount: true,
        setup: (cls, req) => {
          cls.set('requestId', req.headers['x-correlation-id']);
        },
      },
    }),
  ],
  exports: [NestClsModule],
})
export class ClsModule {}
