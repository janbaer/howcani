import { Elysia } from "elysia";
import { StatusCodes } from "http-status-codes";
import { extractBearerToken, type TokenPayload, verifyToken } from "../auth";
import { initSession } from "../services/session";

export function assertAuthenticated(user: TokenPayload | null): asserts user is TokenPayload {
  if (!user) {
    throw new Error("Contract violation: auth middleware must be applied with { auth: true }");
  }
}

export const authPlugin = new Elysia({ name: "auth" })
  .derive({ as: "global" }, async ({ headers }) => {
    const token = extractBearerToken(headers.authorization);

    if (!token) {
      return { user: null as TokenPayload | null };
    }

    const payload = await verifyToken(token);

    // Initialize session for authenticated requests
    if (payload) {
      initSession(payload.userId, payload.username);
    }

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
