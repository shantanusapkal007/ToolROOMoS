import { IsString, IsNotEmpty, IsOptional, IsNumber, Min } from 'class-validator';

export class IssueAssetDto {
  @IsString()
  @IsNotEmpty()
  assetId: string;

  @IsString()
  @IsNotEmpty()
  employeeId: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsString()
  @IsOptional()
  issueDate?: string;

  @IsString()
  @IsOptional()
  expectedReturnDate?: string;

  @IsString()
  @IsOptional()
  conditionBeforeIssue?: string;

  @IsString()
  @IsOptional()
  remarks?: string;
}
