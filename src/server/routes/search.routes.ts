import { Elysia, t } from "elysia";
import { itemService } from "../services";
import { authPlugin } from "../middleware";

export const searchRoutes = new Elysia({ prefix: "/projects/:projectId/search" })
  .use(authPlugin)
  .get(
    "/",
    ({ params, query, user, status }) => {
      if (!query.q || query.q.trim().length === 0) {
        return status(400, { code: "INVALID_QUERY", message: "Search query is required" });
      }

      const limit = query.limit ? parseInt(query.limit, 10) : 20;

      const result = itemService.search(
        params.projectId,
        user!.userId,
        query.q,
        limit
      );

      if (!result.success) {
        const statusCode = result.error.code === "FORBIDDEN" ? 403 : 400;
        return status(statusCode, result.error);
      }

      return { items: result.data };
    },
    {
      auth: true,
      params: t.Object({
        projectId: t.String(),
      }),
      query: t.Object({
        q: t.String(),
        limit: t.Optional(t.String()),
      }),
    }
  );
