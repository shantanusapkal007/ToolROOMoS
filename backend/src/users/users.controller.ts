import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UsersService } from './users.service';

@Controller('api/v1/users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles('ADMIN')
  async create(@Body() dto: any) {
    const data = await this.usersService.create(dto);
    return {
      status: 'success',
      message: 'User created successfully.',
      data,
    };
  }

  @Get()
  @Roles('ADMIN')
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('plantId') plantId?: string,
  ) {
    const result = await this.usersService.findAll({
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      search,
      status,
      plantId,
    });
    return {
      status: 'success',
      message: 'Users retrieved successfully.',
      ...result,
    };
  }

  @Put(':id')
  @Roles('ADMIN')
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: any) {
    const data = await this.usersService.update(id, dto);
    return {
      status: 'success',
      message: 'User updated successfully.',
      data,
    };
  }
}
