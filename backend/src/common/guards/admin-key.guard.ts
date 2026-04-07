import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class AdminKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const adminKey = request.headers['x-admin-key'];
    const expected = process.env.ADMIN_KEY || 'fintrack-admin-secret';

    if (!adminKey || adminKey !== expected) {
      throw new ForbiddenException('Admin access required');
    }
    return true;
  }
}
