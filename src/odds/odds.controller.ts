// src/odds/odds.controller.ts
import { Controller, Get, Param, Query, Body, Put, Delete } from '@nestjs/common';
import { OddsService } from './odds.service';
import { GetEventsDto } from './dto/get-events.dto';
import { GetOddsEventDto } from './dto/get-odds-event.dto';
import { GetOddsSportDto } from './dto/get-odds-sport.dto';

@Controller('api/odds')
export class OddsController {
    constructor(private readonly odds: OddsService) {}

    // SPORTS
    @Get('sports') getSports() { return this.odds.getSports(); }

    // BOOKMAKERS
    @Get('bookmakers') getBookmakers() { return this.odds.getBookmakers(); }
    @Get('bookmakers/selected') getSelected() { return this.odds.getSelectedBookmakers(); }
    @Put('bookmakers/selected') setSelected(@Body('bookmakers') books: string[]) { return this.odds.setSelectedBookmakers(books); }
    @Delete('bookmakers/selected') clearSelected() { return this.odds.clearSelectedBookmakers(); }

    // EVENTS
    @Get('events/:sportKey') getEvents(@Param('sportKey') sportKey: string, @Query() q: GetEventsDto) {
        return this.odds.getEventsBySport(sportKey, q.regions);
    }

    // LIGUES (pour lister dans l’UI)
    @Get('leagues/:sportKey') leagues(@Param('sportKey') sportKey: string, @Query() q: GetEventsDto) {
        return this.odds.listLeagues(sportKey, q.regions);
    }

    // Évènements par ligue (pour la page ligue)
    @Get('events/:sportKey/league/:leagueSlug')
    eventsByLeague(@Param('sportKey') sportKey: string, @Param('leagueSlug') leagueSlug: string, @Query() q: GetEventsDto) {
        return this.odds.getEventsByLeague(sportKey, leagueSlug, q.regions);
    }

    // Live uniquement (pour widget live)
    @Get('events/live/:sportKey')
    live(@Param('sportKey') sportKey: string, @Query() q: GetEventsDto) {
        return this.odds.getLiveEvents(sportKey, q.regions);
    }

    // ODDS
    @Get('odds/:eventId') oddsByEvent(@Param('eventId') eventId: string, @Query() q: GetOddsEventDto) {
        return this.odds.getOddsByEvent(eventId, q);
    }

    // ODDS agrégées (facultatif)
    @Get('sport/:sportKey/odds')
    oddsForSport(@Param('sportKey') sportKey: string, @Query() q: GetOddsSportDto) {
        return this.odds.getOddsForSport(sportKey, {
            regions: q.regions,
            markets: q.markets,
            bookmakers: q.bookmakers,
            limitEvents: q.limitEvents ? Number(q.limitEvents) : undefined,
        });
    }

    // USAGE & MARKETS
    @Get('usage') getUsage() { return this.odds.getUsage(); }
    @Get('markets') markets() { return this.odds.getMarketsList(); }
}
