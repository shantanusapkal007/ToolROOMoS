import { IsOptional, IsString, IsObject } from 'class-validator';

export class UpdatePreferencesDto {
  @IsOptional()
  @IsString()
  key?: string;

  @IsOptional()
  value?: any;

  @IsOptional()
  @IsObject()
  preferences?: Record<string, any>;
}
