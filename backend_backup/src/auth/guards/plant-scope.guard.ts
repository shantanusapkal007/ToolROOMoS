import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';

@Injectable()
export class PlantScopeGuard implements CanActivate {
  constructor(private readonly cls: ClsService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    // Support plantId in body, query, or params
    const plantId = request.body?.plantId || request.query?.plantId || request.params?.plantId;

    if (!plantId) {
      // If no plantId is specified, let the route execute.
      return true;
    }

    const allowedPlants = this.cls.get('allowedPlants') as string[] || [];
    
    const role = this.cls.get('userRole');
    if (role === 'ADMIN') {
      return true;
    }

    if (!allowedPlants.includes(plantId)) {
      throw new ForbiddenException(`You do not have access to plant: ${plantId}`);
    }

    return true;
  }
}
