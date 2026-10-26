import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Module, Controller, Get } from '@nestjs/common';

@Controller('/health')
class HealthController {
  @Get()
  health() { return { status: 'ok', service: 'landshop-enterprise-api', stage: 'foundation' }; }
}
@Module({ controllers: [HealthController] })
class AppModule {}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();
  await app.listen(Number(process.env.PORT || 4000), '127.0.0.1');
}
bootstrap().catch((err) => { console.error(err); process.exitCode = 1; });
