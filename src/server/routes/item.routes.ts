import { Elysia, t } from "elysia";
import { StatusCodes } from "http-status-codes";
import { authPlugin } from "../middleware";
import { itemRepository } from "../repositories/item.repository";
import { userRepository } from "../repositories/user.repository";
import { validateCreateItemData, validateUpdateItemData } from "../domain/item";

export const itemRoutes = new Elysia({ prefix: "/:username/items" })
  .use(authPlugin)
  .get(
    "/",
    ({ params, query, set }) => {
      const user = userRepository.findByUsername(params.username);
      if (!user) {
        set.status = StatusCodes.NOT_FOUND;
        return { error: { message: "User not found", code: "NOT_FOUND" } };
      }

      const parsedLimit = query.limit ? parseInt(query.limit, 10) : 50;
      const parsedOffset = query.offset ? parseInt(query.offset, 10) : 0;
      const limit = Math.min(Math.max(Number.isFinite(parsedLimit) ? parsedLimit : 50, 1), 100);
      const offset = Math.max(Number.isFinite(parsedOffset) ? parsedOffset : 0, 0);

      const result = itemRepository.findByUserId(user.id, { limit, offset });

      return { items: result.items, total: result.total };
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
      const user = userRepository.findByUsername(params.username);
      if (!user) {
        set.status = StatusCodes.NOT_FOUND;
        return { error: { message: "User not found", code: "NOT_FOUND" } };
      }

      const item = itemRepository.findByIdAndUserId(params.id, user.id);
      if (!item) {
        set.status = StatusCodes.NOT_FOUND;
        return { error: { message: "Item not found", code: "NOT_FOUND" } };
      }

      return { item };
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

      const validation = validateCreateItemData(body);
      if (!validation.valid) {
        set.status = StatusCodes.BAD_REQUEST;
        return { error: { message: validation.errors[0], code: "VALIDATION_ERROR" } };
      }

      const item = itemRepository.create({
        userId: user.userId,
        question: body.question,
        answer: body.answer ?? "",
      });

      set.status = StatusCodes.CREATED;
      return { item };
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

      const validation = validateUpdateItemData(body);
      if (!validation.valid) {
        set.status = StatusCodes.BAD_REQUEST;
        return { error: { message: validation.errors[0], code: "VALIDATION_ERROR" } };
      }

      const existingItem = itemRepository.findByIdAndUserId(params.id, user.userId);
      if (!existingItem) {
        set.status = StatusCodes.NOT_FOUND;
        return { error: { message: "Item not found", code: "NOT_FOUND" } };
      }

      const item = itemRepository.update(params.id, {
        question: body.question,
        answer: body.answer,
      });

      return { item };
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

      const existingItem = itemRepository.findByIdAndUserId(params.id, user.userId);
      if (!existingItem) {
        set.status = StatusCodes.NOT_FOUND;
        return { error: { message: "Item not found", code: "NOT_FOUND" } };
      }

      itemRepository.delete(params.id);

      return { success: true };
    },
    {
      params: t.Object({
        username: t.String(),
        id: t.String(),
      }),
    }
  );
