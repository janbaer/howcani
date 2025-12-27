import { Elysia, t } from "elysia";
import { authService } from "../services/auth.service";
import { authPlugin } from "../middleware";

const REFRESH_TOKEN_COOKIE = "refresh_token";
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
  path: "/",
};

export const authRoutes = new Elysia({ prefix: "/auth" })
  .use(authPlugin)
  .post(
    "/register",
    async ({ body, status, cookie }) => {
      const result = await authService.register(body);

      if (!result.success) {
        return status(400, result.error);
      }

      cookie[REFRESH_TOKEN_COOKIE].set({
        value: result.data.refreshToken,
        ...COOKIE_OPTIONS,
      });

      return {
        user: result.data.user,
        accessToken: result.data.accessToken,
      };
    },
    {
      body: t.Object({
        username: t.String({ minLength: 3, maxLength: 20 }),
        email: t.String({ format: "email" }),
        password: t.String({ minLength: 8 }),
        displayName: t.Optional(t.String()),
      }),
    }
  )
  .post(
    "/login",
    async ({ body, status, cookie }) => {
      const result = await authService.login(body);

      if (!result.success) {
        return status(401, result.error);
      }

      cookie[REFRESH_TOKEN_COOKIE].set({
        value: result.data.refreshToken,
        ...COOKIE_OPTIONS,
      });

      return {
        user: result.data.user,
        accessToken: result.data.accessToken,
      };
    },
    {
      body: t.Object({
        login: t.String(),
        password: t.String(),
      }),
    }
  )
  .post("/refresh", async ({ cookie, status }) => {
    const refreshToken = cookie[REFRESH_TOKEN_COOKIE].value;

    if (!refreshToken) {
      return status(401, { error: "NO_REFRESH_TOKEN", message: "No refresh token provided" });
    }

    const result = await authService.refresh(refreshToken);

    if (!result.success) {
      cookie[REFRESH_TOKEN_COOKIE].remove();
      return status(401, result.error);
    }

    return { accessToken: result.data.accessToken };
  })
  .post("/logout", ({ cookie }) => {
    cookie[REFRESH_TOKEN_COOKIE].remove();
    return { success: true };
  })
  .get(
    "/me",
    ({ user, status }) => {
      const userData = authService.getUserById(user!.userId);
      if (!userData) {
        return status(404, { error: "USER_NOT_FOUND", message: "User not found" });
      }
      return userData;
    },
    { auth: true }
  );
