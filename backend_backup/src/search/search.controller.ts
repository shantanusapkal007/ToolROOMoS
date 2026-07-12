import { Controller, Get, Query } from '@nestjs/common';
import { SearchService } from './search.service';

@Controller('api/v1/search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  async search(@Query('q') q: string) {
    const data = await this.searchService.searchAll(q);
    return {
      status: 'success',
      message: 'Search completed successfully.',
      data,
    };
  }
}
