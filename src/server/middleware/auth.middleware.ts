import { Elysia, t } from "elysia";
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
      beforeHandle({ user, status }) {
        if (!user) {
          return status(401, { error: "Unauthorized", message: "Authentication required" });
        }
      },
    },
  });

export type AuthPlugin = typeof authPlugin;
