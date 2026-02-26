import { Elysia, t } from 'elysia';
import { StatusCodes } from 'http-status-codes';
import { itemService } from '../services/item.service';

export const duplicateRoutes = new Elysia({ prefix: '/:username' }).get(
  '/duplicates',
  ({ params, set }) => {
    const result = itemService.getAllDuplicates(params.username);

    if (!result.success) {
      if (result.error.code === 'USER_NOT_FOUND') {
        set.status = StatusCodes.NOT_FOUND;
        return { error: { message: result.error.message, code: 'NOT_FOUND' } };
      }
      set.status = StatusCodes.INTERNAL_SERVER_ERROR;
      return { error: { message: result.error.message, code: result.error.code } };
    }

    return { groups: result.data };
  },
  {
    params: t.Object({
      username: t.String(),
    }),
  },
);
