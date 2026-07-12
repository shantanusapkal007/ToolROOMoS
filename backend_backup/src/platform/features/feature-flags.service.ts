import { Injectable } from '@nestjs/common';

@Injectable()
export class FeatureFlagsService {
  private flags: Record<string, boolean> = {
    'ENABLE_NEW_MRP': false,
    'ENABLE_ADVANCED_SEARCH': true,
  };

  isEnabled(flagName: string): boolean {
    return this.flags[flagName] === true;
  }
}
