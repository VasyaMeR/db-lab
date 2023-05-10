import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { DevtoolsModule } from '@nestjs/devtools-integration';
import { PrismaService } from './prisma.service';

@Module({
  imports: [
    DevtoolsModule.register({
      http: process.env.NODE_ENV !== 'production',
    }),
  ],
  controllers: [AppController],
  providers: [PrismaService],
})
export class AppModule {}
