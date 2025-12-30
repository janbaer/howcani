import { Elysia, t } from "elysia";
import { itemService } from "../services";
import { authPlugin } from "../middleware";

export const itemRoutes = new Elysia({ prefix: "/projects/:projectId/items" })
  .use(authPlugin)
  .get(
    "/",
    ({ params, query, user, status }) => {
      const result = itemService.list(params.projectId, user!.userId, {
        categoryId: query.categoryId,
        search: query.search,
        limit: query.limit ? parseInt(query.limit, 10) : undefined,
        offset: query.offset ? parseInt(query.offset, 10) : undefined,
        orderBy: query.orderBy as "created_at" | "updated_at" | "title" | "view_count" | undefined,
        orderDir: query.orderDir as "ASC" | "DESC" | undefined,
      });

      if (!result.success) {
        const statusCode = result.error.code === "FORBIDDEN" ? 403 : 400;
        return status(statusCode, result.error);
      }

      return result.data;
    },
    {
      auth: true,
      params: t.Object({
        projectId: t.String(),
      }),
      query: t.Object({
        categoryId: t.Optional(t.String()),
        search: t.Optional(t.String()),
        limit: t.Optional(t.String()),
        offset: t.Optional(t.String()),
        orderBy: t.Optional(t.String()),
        orderDir: t.Optional(t.String()),
      }),
    }
  )
  .post(
    "/",
    ({ params, body, user, status }) => {
      const result = itemService.create(params.projectId, user!.userId, body);

      if (!result.success) {
        const statusCode = result.error.code === "FORBIDDEN" ? 403 : 400;
        return status(statusCode, result.error);
      }

      return result.data;
    },
    {
      auth: true,
      params: t.Object({
        projectId: t.String(),
      }),
      body: t.Object({
        title: t.String({ minLength: 1, maxLength: 200 }),
        content: t.String({ minLength: 1 }),
        summary: t.Optional(t.String()),
        categoryId: t.Optional(t.String()),
      }),
    }
  )
  .get(
    "/:itemId",
    ({ params, user, status }) => {
      const result = itemService.getById(
        params.itemId,
        params.projectId,
        user!.userId
      );

      if (!result.success) {
        const statusCode = result.error.code === "FORBIDDEN" ? 403 : 404;
        return status(statusCode, result.error);
      }

      return result.data;
    },
    {
      auth: true,
      params: t.Object({
        projectId: t.String(),
        itemId: t.String(),
      }),
    }
  )
  .put(
    "/:itemId",
    ({ params, body, user, status }) => {
      const result = itemService.update(
        params.itemId,
        params.projectId,
        user!.userId,
        body
      );

      if (!result.success) {
        const statusCode =
          result.error.code === "FORBIDDEN" ? 403 :
          result.error.code === "NOT_FOUND" ? 404 : 400;
        return status(statusCode, result.error);
      }

      return result.data;
    },
    {
      auth: true,
      params: t.Object({
        projectId: t.String(),
        itemId: t.String(),
      }),
      body: t.Object({
        title: t.Optional(t.String({ minLength: 1, maxLength: 200 })),
        content: t.Optional(t.String({ minLength: 1 })),
        summary: t.Optional(t.String()),
        categoryId: t.Optional(t.Union([t.String(), t.Null()])),
      }),
    }
  )
  .delete(
    "/:itemId",
    ({ params, user, status }) => {
      const result = itemService.delete(
        params.itemId,
        params.projectId,
        user!.userId
      );

      if (!result.success) {
        const statusCode = result.error.code === "FORBIDDEN" ? 403 : 404;
        return status(statusCode, result.error);
      }

      return { success: true };
    },
    {
      auth: true,
      params: t.Object({
        projectId: t.String(),
        itemId: t.String(),
      }),
    }
  )
  .post(
    "/:itemId/view",
    ({ params, status }) => {
      const result = itemService.incrementView(params.itemId, params.projectId);

      if (!result.success) {
        return status(404, result.error);
      }

      return result.data;
    },
    {
      params: t.Object({
        projectId: t.String(),
        itemId: t.String(),
      }),
    }
  );
