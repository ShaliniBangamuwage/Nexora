import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator.js';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest();
    console.log(
      `[RolesGuard] Required: ${requiredRoles}, User Role: ${user?.role}`,
    );

    if (!user || !user.role) {
      console.warn(`[RolesGuard] Access denied: User or role missing.`);
      return false;
    }

    const hasRole = requiredRoles.some(
      (role) => user.role.toLowerCase().trim() === role.toLowerCase().trim(),
    );

    if (!hasRole) {
      console.warn(
        `[RolesGuard] Access denied: User role '${user.role}' does not match required roles '${requiredRoles}'`,
      );
    }

    return hasRole;
  }
}
