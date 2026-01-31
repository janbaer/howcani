import { Elysia, t } from "elysia";
import { StatusCodes } from "http-status-codes";
import { authPlugin } from "../middleware";
import { itemService } from "../services/item.service";
import { getSession } from "../services/session";

export const itemRoutes = new Elysia({ prefix: "/:username/items" })
  .use(authPlugin)
  .get(
    "/",
    ({ params, query, set }) => {
      const parsedLimit = query.limit ? parseInt(query.limit, 10) : 50;
      const parsedOffset = query.offset ? parseInt(query.offset, 10) : 0;
      const limit = Math.min(Math.max(Number.isFinite(parsedLimit) ? parsedLimit : 50, 1), 100);
      const offset = Math.max(Number.isFinite(parsedOffset) ? parsedOffset : 0, 0);

      const result = itemService.listItems(params.username, { limit, offset });

      if (!result.success) {
        if (result.error.code === "USER_NOT_FOUND") {
          set.status = StatusCodes.NOT_FOUND;
          return { error: { message: result.error.message, code: "NOT_FOUND" } };
        }
        set.status = StatusCodes.INTERNAL_SERVER_ERROR;
        return { error: { message: result.error.message, code: result.error.code } };
      }

      return { items: result.data.items, total: result.data.total };
    },
    {
      params: t.Object({
        username: t.String(),
      }),
      query: t.Object({
        limit: t.Optional(t.String()),
        offset: t.Optional(t.String()),
      }),
    }
  )
  .get(
    "/:id",
    ({ params, set }) => {
      const result = itemService.getItem(params.id, params.username);

      if (!result.success) {
        set.status = StatusCodes.NOT_FOUND;
        return { error: { message: result.error.message, code: "NOT_FOUND" } };
      }

      return { item: result.data };
    },
    {
      params: t.Object({
        username: t.String(),
        id: t.String(),
      }),
    }
  )
  .post(
    "/",
    ({ params, body, user, set }) => {
      if (!user) {
        set.status = StatusCodes.UNAUTHORIZED;
        return { error: { message: "Authentication required", code: "UNAUTHORIZED" } };
      }

      if (user.username !== params.username) {
        set.status = StatusCodes.FORBIDDEN;
        return { error: { message: "Not authorized to modify this user's content", code: "FORBIDDEN" } };
      }

      const { itemService: sessionItemService } = getSession();
      const result = sessionItemService.createItem({
        question: body.question ?? "",
        answer: body.answer,
        tags: body.tags,
      });

      if (!result.success) {
        set.status = StatusCodes.BAD_REQUEST;
        return { error: { message: result.error.message, code: result.error.code } };
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
    }
  )
  .put(
    "/:id",
    ({ params, body, user, set }) => {
      if (!user) {
        set.status = StatusCodes.UNAUTHORIZED;
        return { error: { message: "Authentication required", code: "UNAUTHORIZED" } };
      }

      if (user.username !== params.username) {
        set.status = StatusCodes.FORBIDDEN;
        return { error: { message: "Not authorized to modify this user's content", code: "FORBIDDEN" } };
      }

      const { itemService: sessionItemService } = getSession();
      const result = sessionItemService.updateItem(params.id, {
        question: body.question,
        answer: body.answer,
        tags: body.tags,
      });

      if (!result.success) {
        if (result.error.code === "NOT_FOUND") {
          set.status = StatusCodes.NOT_FOUND;
        } else {
          set.status = StatusCodes.BAD_REQUEST;
        }
        return { error: { message: result.error.message, code: result.error.code } };
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
    }
  )
  .delete(
    "/:id",
    ({ params, user, set }) => {
      if (!user) {
        set.status = StatusCodes.UNAUTHORIZED;
        return { error: { message: "Authentication required", code: "UNAUTHORIZED" } };
      }

      if (user.username !== params.username) {
        set.status = StatusCodes.FORBIDDEN;
        return { error: { message: "Not authorized to modify this user's content", code: "FORBIDDEN" } };
      }

      const { itemService: sessionItemService } = getSession();
      const result = sessionItemService.deleteItem(params.id);

      if (!result.success) {
        set.status = StatusCodes.NOT_FOUND;
        return { error: { message: result.error.message, code: "NOT_FOUND" } };
      }

      return { success: true };
    },
    {
      params: t.Object({
        username: t.String(),
        id: t.String(),
      }),
    }
  );
