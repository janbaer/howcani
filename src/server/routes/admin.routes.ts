import { Elysia, t } from 'elysia';
import { StatusCodes } from 'http-status-codes';
import { getConfig } from '../config/config.service';
import { assertAuthenticated, authPlugin } from '../middleware';
import { itemRepository } from '../repositories/item.repository';
import { embeddingService } from '../services/embedding.service';

export const adminRoutes = new Elysia({ prefix: '/admin' }).use(authPlugin).get(
  '/search-debug',
  async ({ user, query, set }) => {
    assertAuthenticated(user);

    const q = (query.q ?? '').trim();
    if (q === '') {
      set.status = StatusCodes.BAD_REQUEST;
      return { error: { code: 'VALIDATION_ERROR', message: 'Query parameter `q` is required' } };
    }

    const limit = query.limit ? Number(query.limit) : 10;
    if (!Number.isInteger(limit) || limit <= 0 || limit > 100) {
      set.status = StatusCodes.BAD_REQUEST;
      return { error: { code: 'VALIDATION_ERROR', message: '`limit` must be an integer between 1 and 100' } };
    }

    const semanticEnabled = getConfig().embedding.enabled;
    const queryVector = semanticEnabled ? await embeddingService.embedQuery(q) : null;

    const debug = itemRepository.searchDebug(user.userId, q, limit, queryVector);
    return { query: q, ...debug };
  },
  {
    auth: true,
    query: t.Object({
      q: t.Optional(t.String()),
      limit: t.Optional(t.String()),
    }),
  },
);
