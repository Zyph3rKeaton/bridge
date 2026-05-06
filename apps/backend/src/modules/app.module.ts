import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthController } from './health.controller';
import { EventsModule } from './events/events.module';
import { BoardsModule } from './boards/boards.module';
import { ResultsModule } from './results/results.module';
import { RankingsModule } from './rankings/rankings.module';
import { ExportsModule } from './exports/exports.module';
import { SettingsModule } from './settings/settings.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventsModule,
    BoardsModule,
    ResultsModule,
    RankingsModule,
    ExportsModule,
    SettingsModule,
  ],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
