import { Elysia, t } from "elysia";
import { projectService } from "../services";
import { authPlugin } from "../middleware";

export const projectRoutes = new Elysia({ prefix: "/projects" })
  .use(authPlugin)
  .get(
    "/",
    ({ user }) => {
      return projectService.getByUserId(user!.userId);
    },
    { auth: true }
  )
  .post(
    "/",
    ({ body, user, status }) => {
      const result = projectService.create(user!.userId, body);

      if (!result.success) {
        const statusCode = result.error.code === "NAME_EXISTS" ? 409 : 400;
        return status(statusCode, result.error);
      }

      return result.data;
    },
    {
      auth: true,
      body: t.Object({
        name: t.String({ minLength: 1, maxLength: 100 }),
        description: t.Optional(t.String()),
        isDefault: t.Optional(t.Boolean()),
      }),
    }
  )
  .get(
    "/:projectId",
    ({ params, user, status }) => {
      const result = projectService.getById(params.projectId, user!.userId);

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
  .put(
    "/:projectId",
    ({ params, body, user, status }) => {
      const result = projectService.update(params.projectId, user!.userId, body);

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
      }),
      body: t.Object({
        name: t.Optional(t.String({ minLength: 1, maxLength: 100 })),
        description: t.Optional(t.String()),
        isDefault: t.Optional(t.Boolean()),
      }),
    }
  )
  .delete(
    "/:projectId",
    ({ params, user, status }) => {
      const result = projectService.delete(params.projectId, user!.userId);

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
      }),
    }
  )
  .post(
    "/:projectId/default",
    ({ params, user, status }) => {
      const result = projectService.setDefault(params.projectId, user!.userId);

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
  );
