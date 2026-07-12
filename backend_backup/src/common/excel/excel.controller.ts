import { Controller, Get, Post, Param, Res, UseGuards, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { ExcelService } from './excel.service';
import type { Response } from 'express';

@Controller('api/v1/excel')
@UseGuards(JwtAuthGuard)
export class ExcelController {
  constructor(private readonly excelService: ExcelService) {}

  // Example route — specific modules will typically inject ExcelService directly
  // and expose their own /import and /export endpoints, but this controller
  // can act as a universal handler if a generic registry of validators is built.

  @Get(':module/template')
  async downloadTemplate(@Param('module') module: string, @Res() res: Response) {
    // Basic fallback template generator. In a real system, you'd map 'module' 
    // to a specific column schema.
    const columns = [
      { header: 'Column1', key: 'col1' },
      { header: 'Column2', key: 'col2' },
    ];
    await this.excelService.generateTemplate(columns, res, `${module}_template`);
  }

  @Post(':module/import')
  @UseInterceptors(FileInterceptor('file'))
  async importData(
    @Param('module') module: string,
    @UploadedFile() file: any,
    @CurrentUser() user: any
  ) {
    if (!file) {
      throw new BadRequestException('No Excel file provided.');
    }

    // Generic validator — specific modules will implement their own
    const result = await this.excelService.importData(file.buffer, async (row, idx) => {
      // Dummy validation for the generic endpoint
      return { isValid: true, rowData: row };
    });

    return { status: 'success', message: 'Import completed.', data: result };
  }
}
