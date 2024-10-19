import {
  createParamDecorator,
  ExecutionContext,
  ForbiddenException,
  SetMetadata,
} from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export const IsAccountOwner = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const loggedInUser = request.user;
    const usernameOrId = request.params.usernameOrId;

    if (!loggedInUser) {
      throw new ForbiddenException('No authenticated user found');
    }

    if (!usernameOrId) {
      throw new ForbiddenException('No username or ID parameter provided');
    }

    const parsedId = Number(usernameOrId);

    if (!isNaN(parsedId)) {
      return loggedInUser;
    } else {
      if (loggedInUser.username !== usernameOrId) {
        throw new ForbiddenException(
          'You are not authorized to modify this account',
        );
      }
    }

    return loggedInUser;
  },
);
