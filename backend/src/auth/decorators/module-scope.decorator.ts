import { SetMetadata } from '@nestjs/common';

export const MODULE_SCOPE_KEY = 'module_scope';
export const ModuleScope = (moduleName: string) => SetMetadata(MODULE_SCOPE_KEY, moduleName);
