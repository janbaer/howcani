import { Elysia, t } from 'elysia';
import { StatusCodes } from 'http-status-codes';
import { authPlugin } from '../middleware';
import { tagService } from '../services/tag.service';

export const tagRoutes = new Elysia({ prefix: '/:username/tags' })
  .use(authPlugin)
  .get(
    '/',
    ({ params, set }) => {
      const result = tagService.listTags(params.username);

      if (!result.success) {
        set.status = StatusCodes.NOT_FOUND;
        return { error: { message: result.error.message, code: 'NOT_FOUND' } };
      }

      return { tags: result.data };
    },
    {
      params: t.Object({
        username: t.String(),
      }),
    },
  )
  .get(
    '/suggestions',
    ({ params, query, set }) => {
      const prefix = query.q ?? '';
      const result = tagService.getSuggestions(params.username, prefix);

      if (!result.success) {
        set.status = StatusCodes.NOT_FOUND;
        return { error: { message: result.error.message, code: 'NOT_FOUND' } };
      }

      return { suggestions: result.data };
    },
    {
      params: t.Object({
        username: t.String(),
      }),
      query: t.Object({
        q: t.Optional(t.String()),
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

      const result = session.tagService.updateTag(params.id, {
        name: body.name,
        color: body.color,
      });

      if (!result.success) {
        if (result.error.code === 'NOT_FOUND') {
          set.status = StatusCodes.NOT_FOUND;
          return { error: { message: result.error.message, code: 'NOT_FOUND' } };
        }
        if (result.error.code === 'DUPLICATE_TAG') {
          set.status = StatusCodes.BAD_REQUEST;
          return { error: { message: result.error.message, code: 'VALIDATION_ERROR' } };
        }
        if (result.error.code === 'VALIDATION_ERROR') {
          set.status = StatusCodes.BAD_REQUEST;
          return { error: { message: result.error.message, code: 'VALIDATION_ERROR' } };
        }
        set.status = StatusCodes.INTERNAL_SERVER_ERROR;
        return { error: { message: result.error.message, code: result.error.code } };
      }

      return { tag: result.data };
    },
    {
      params: t.Object({
        username: t.String(),
        id: t.String(),
      }),
      body: t.Object({
        name: t.Optional(t.String()),
        color: t.Optional(t.String()),
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

      const result = session.tagService.deleteTag(params.id);

      if (!result.success) {
        if (result.error.code === 'NOT_FOUND') {
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

      return { success: true };
    },
    {
      params: t.Object({
        username: t.String(),
        id: t.String(),
      }),
    },
  );
