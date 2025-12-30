import { Elysia, t } from "elysia";
import { categoryService } from "../services";
import { authPlugin } from "../middleware";

export const categoryRoutes = new Elysia({ prefix: "/projects/:projectId/categories" })
  .use(authPlugin)
  .get(
    "/",
    ({ params, user, status }) => {
      const result = categoryService.getByProjectId(params.projectId, user!.userId);

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
      }),
    }
  )
  .post(
    "/",
    ({ params, body, user, status }) => {
      const result = categoryService.create(params.projectId, user!.userId, body);

      if (!result.success) {
        const statusCode =
          result.error.code === "FORBIDDEN" ? 403 :
          result.error.code === "NAME_EXISTS" ? 409 : 400;
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
        name: t.String({ minLength: 1, maxLength: 50 }),
        color: t.Optional(t.String({ pattern: "^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$" })),
        icon: t.Optional(t.String()),
      }),
    }
  )
  .get(
    "/:categoryId",
    ({ params, user, status }) => {
      const result = categoryService.getById(
        params.categoryId,
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
        categoryId: t.String(),
      }),
    }
  )
  .put(
    "/:categoryId",
    ({ params, body, user, status }) => {
      const result = categoryService.update(
        params.categoryId,
        params.projectId,
        user!.userId,
        body
      );

      if (!result.success) {
        const statusCode =
          result.error.code === "FORBIDDEN" ? 403 :
          result.error.code === "NOT_FOUND" ? 404 :
          result.error.code === "NAME_EXISTS" ? 409 : 400;
        return status(statusCode, result.error);
      }

      return result.data;
    },
    {
      auth: true,
      params: t.Object({
        projectId: t.String(),
        categoryId: t.String(),
      }),
      body: t.Object({
        name: t.Optional(t.String({ minLength: 1, maxLength: 50 })),
        color: t.Optional(t.String({ pattern: "^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$" })),
        icon: t.Optional(t.String()),
        displayOrder: t.Optional(t.Number({ minimum: 0 })),
      }),
    }
  )
  .delete(
    "/:categoryId",
    ({ params, user, status }) => {
      const result = categoryService.delete(
        params.categoryId,
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
        categoryId: t.String(),
      }),
    }
  )
  .put(
    "/reorder",
    ({ params, body, user, status }) => {
      const result = categoryService.reorder(
        params.projectId,
        user!.userId,
        body.categoryIds
      );

      if (!result.success) {
        const statusCode = result.error.code === "FORBIDDEN" ? 403 : 400;
        return status(statusCode, result.error);
      }

      return { success: true };
    },
    {
      auth: true,
      params: t.Object({
        projectId: t.String(),
      }),
      body: t.Object({
        categoryIds: t.Array(t.String()),
      }),
    }
  );
