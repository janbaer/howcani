import { Elysia } from "elysia";
import { StatusCodes } from "http-status-codes";
import { extractBearerToken, verifyToken, type TokenPayload } from "../auth";

export const authPlugin = new Elysia({ name: "auth" })
  .derive({ as: "global" }, async ({ headers }) => {
    const token = extractBearerToken(headers.authorization);

    if (!token) {
      return { user: null as TokenPayload | null };
    }

    const payload = await verifyToken(token);
    return { user: payload };
  })
  .macro({
    auth: {
      beforeHandle({ user, set }) {
        if (!user) {
          set.status = StatusCodes.UNAUTHORIZED;
          return {
            error: {
              message: "Authentication required",
              code: "UNAUTHORIZED",
            },
          };
        }
      },
    },
  });

export type AuthPlugin = typeof authPlugin;
