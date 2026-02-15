import { Elysia, t } from 'elysia';
import { StatusCodes } from 'http-status-codes';
import { authPlugin } from '../middleware';
import { itemService } from '../services/item.service';

export const itemRoutes = new Elysia({ prefix: '/:username/items' })
  .use(authPlugin)
  .get(
    '/',
    ({ params, query, set }) => {
      const parsedLimit = query.limit ? parseInt(query.limit, 10) : 50;
      const parsedOffset = query.offset ? parseInt(query.offset, 10) : 0;
      const limit = Math.min(Math.max(Number.isFinite(parsedLimit) ? parsedLimit : 50, 1), 100);
      const offset = Math.max(Number.isFinite(parsedOffset) ? parsedOffset : 0, 0);

      const search = query.search || undefined;
      const tags = query.tags
        ? query.tags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)
        : undefined;

      const result = itemService.listItems(params.username, { limit, offset }, { search, tags });

      if (!result.success) {
        if (result.error.code === 'USER_NOT_FOUND') {
          set.status = StatusCodes.NOT_FOUND;
          return {
            error: { message: result.error.message, code: 'NOT_FOUND' },
          };
        }
        set.status = StatusCodes.INTERNAL_SERVER_ERROR;
        return {
          error: { message: result.error.message, code: result.error.code },
        };
      }

      return { items: result.data.items, total: result.data.total, filters: result.data.filters };
    },
    {
      params: t.Object({
        username: t.String(),
      }),
      query: t.Object({
        limit: t.Optional(t.String()),
        offset: t.Optional(t.String()),
        search: t.Optional(t.String()),
        tags: t.Optional(t.String()),
      }),
    },
  )
  .get(
    '/:id',
    ({ params, set }) => {
      const result = itemService.getItem(params.id, params.username);

      if (!result.success) {
        set.status = StatusCodes.NOT_FOUND;
        return { error: { message: result.error.message, code: 'NOT_FOUND' } };
      }

      return { item: result.data };
    },
    {
      params: t.Object({
        username: t.String(),
        id: t.String(),
      }),
    },
  )
  .post(
    '/',
    ({ params, body, user, session, set }) => {
      if (!user || !session) {
        set.status = StatusCodes.UNAUTHORIZED;
        return {
          error: { message: 'Authentication required', code: 'UNAUTHORIZED' },
        };
      }

      if (user.username !== params.username) {
        set.status = StatusCodes.FORBIDDEN;
        return {
          error: {
            message: "Not authorized to modify this user's content",
            code: 'FORBIDDEN',
          },
        };
      }

      const result = session.itemService.createItem({
        question: body.question ?? '',
        answer: body.answer,
        tags: body.tags,
      });

      if (!result.success) {
        set.status = StatusCodes.BAD_REQUEST;
        return {
          error: { message: result.error.message, code: result.error.code },
        };
      }

      set.status = StatusCodes.CREATED;
      return { item: result.data };
    },
    {
      params: t.Object({
        username: t.String(),
      }),
      body: t.Object({
        question: t.Optional(t.String()),
        answer: t.Optional(t.String()),
        tags: t.Optional(t.Array(t.String())),
      }),
    },
  )
  .put(
    '/:id',
    ({ params, body, user, session, set }) => {
      if (!user || !session) {
        set.status = StatusCodes.UNAUTHORIZED;
        return {
          error: { message: 'Authentication required', code: 'UNAUTHORIZED' },
        };
      }

      if (user.username !== params.username) {
        set.status = StatusCodes.FORBIDDEN;
        return {
          error: {
            message: "Not authorized to modify this user's content",
            code: 'FORBIDDEN',
          },
        };
      }

      const result = session.itemService.updateItem(params.id, {
        question: body.question,
        answer: body.answer,
        tags: body.tags,
      });

      if (!result.success) {
        if (result.error.code === 'NOT_FOUND') {
          set.status = StatusCodes.NOT_FOUND;
        } else {
          set.status = StatusCodes.BAD_REQUEST;
        }
        return {
          error: { message: result.error.message, code: result.error.code },
        };
      }

      return { item: result.data };
    },
    {
      params: t.Object({
        username: t.String(),
        id: t.String(),
      }),
      body: t.Object({
        question: t.Optional(t.String()),
        answer: t.Optional(t.String()),
        tags: t.Optional(t.Array(t.String())),
      }),
    },
  )
  .delete(
    '/:id',
    ({ params, user, session, set }) => {
      if (!user || !session) {
        set.status = StatusCodes.UNAUTHORIZED;
        return {
          error: { message: 'Authentication required', code: 'UNAUTHORIZED' },
        };
      }

      if (user.username !== params.username) {
        set.status = StatusCodes.FORBIDDEN;
        return {
          error: {
            message: "Not authorized to modify this user's content",
            code: 'FORBIDDEN',
          },
        };
      }

      const result = session.itemService.deleteItem(params.id);

      if (!result.success) {
        set.status = StatusCodes.NOT_FOUND;
        return { error: { message: result.error.message, code: 'NOT_FOUND' } };
      }

      return { success: true };
    },
    {
      params: t.Object({
        username: t.String(),
        id: t.String(),
      }),
    },
  );
