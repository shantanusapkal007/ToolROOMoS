import { Injectable, BadRequestException } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { Response } from 'express';

/**
 * ExcelService — Universal Excel Import/Export
 * 
 * Supports exporting data to XLSX, downloading templates, and importing data.
 * Import validates at the row level — it imports valid rows and returns an error
 * report for invalid rows instead of rejecting the entire file.
 */
@Injectable()
export class ExcelService {
  /**
   * Generate an Excel Template based on column definitions
   */
  async generateTemplate(columns: Array<{ header: string; key: string; width?: number }>, res: Response, fileName: string) {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Template');
    
    sheet.columns = columns.map(c => ({
      header: c.header,
      key: c.key,
      width: c.width || 20,
    }));

    // Style the header row
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}.xlsx"`);
    
    await workbook.xlsx.write(res);
    res.end();
  }

  /**
   * Export Data to Excel
   */
  async exportData(data: any[], columns: Array<{ header: string; key: string; width?: number }>, res: Response, fileName: string) {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Data');
    
    sheet.columns = columns.map(c => ({
      header: c.header,
      key: c.key,
      width: c.width || 20,
    }));

    // Style the header row
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    // Add data
    data.forEach(row => {
      sheet.addRow(row);
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}.xlsx"`);
    
    await workbook.xlsx.write(res);
    res.end();
  }

  /**
   * Parse an uploaded Excel file and validate row-by-row
   */
  async importData(buffer: Buffer, validator: (row: any, index: number) => Promise<{ isValid: boolean; rowData?: any; errors?: string[] }>) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as any);
    
    const sheet = workbook.worksheets[0];
    if (!sheet) {
      throw new BadRequestException('Excel file is empty or invalid.');
    }

    const headers: string[] = [];
    sheet.getRow(1).eachCell((cell, colNumber) => {
      headers[colNumber] = cell.value?.toString().trim() || `Column_${colNumber}`;
    });

    const validRows: any[] = [];
    const errorRows: Array<{ rowNum: number; data: any; errors: string[] }> = [];

    // Parse each row (skipping header)
    const rowPromises: Array<() => Promise<void>> = [];
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header
      
      const rowData: any = {};
      row.eachCell((cell, colNumber) => {
        const header = headers[colNumber];
        if (header) {
          rowData[header] = cell.value;
        }
      });
      
      rowPromises.push(async () => {
        const result = await validator(rowData, rowNumber);
        if (result.isValid && result.rowData) {
          validRows.push(result.rowData);
        } else {
          errorRows.push({
            rowNum: rowNumber,
            data: rowData,
            errors: result.errors || ['Validation failed'],
          });
        }
      });
    });

    // Execute validations concurrently or sequentially (using Promise.all here for speed, but sequentially is safer for DB locks)
    // We will do sequentially to avoid DB connection pool exhaustion on large imports
    for (const promise of rowPromises) {
      await promise();
    }

    return {
      totalRows: rowPromises.length,
      importedCount: validRows.length,
      errorCount: errorRows.length,
      validRows,
      errorRows,
    };
  }
}
