import { Elysia, t } from "elysia";
import { userRepository } from "../repositories";
import { authPlugin } from "../middleware";

export const userRoutes = new Elysia({ prefix: "/users" })
  .use(authPlugin)
  .get(
    "/:id",
    ({ params, status }) => {
      const user = userRepository.findById(params.id);

      if (!user) {
        return status(404, { error: "USER_NOT_FOUND", message: "User not found" });
      }

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password_hash: _, ...safeUser } = user;
      return safeUser;
    },
    { auth: true }
  )
  .put(
    "/:id",
    ({ params, body, user, status }) => {
      if (user!.userId !== params.id) {
        return status(403, { error: "FORBIDDEN", message: "You can only update your own profile" });
      }

      const existingUser = userRepository.findById(params.id);
      if (!existingUser) {
        return status(404, { error: "USER_NOT_FOUND", message: "User not found" });
      }

      // Check if new username is taken by another user
      if (body.username && body.username !== existingUser.username) {
        if (userRepository.usernameExists(body.username)) {
          return status(400, { error: "USERNAME_TAKEN", message: "Username is already taken" });
        }
      }

      // Check if new email is taken by another user
      if (body.email && body.email !== existingUser.email) {
        if (userRepository.emailExists(body.email)) {
          return status(400, { error: "EMAIL_TAKEN", message: "Email is already registered" });
        }
      }

      const updated = userRepository.update(params.id, body);
      if (!updated) {
        return status(500, { error: "UPDATE_FAILED", message: "Failed to update user" });
      }

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password_hash: _, ...safeUser } = updated;
      return safeUser;
    },
    {
      auth: true,
      body: t.Object({
        username: t.Optional(t.String({ minLength: 3, maxLength: 20 })),
        email: t.Optional(t.String({ format: "email" })),
        displayName: t.Optional(t.String()),
      }),
    }
  )
  .delete(
    "/:id",
    ({ params, user, status }) => {
      if (user!.userId !== params.id) {
        return status(403, { error: "FORBIDDEN", message: "You can only delete your own account" });
      }

      const deleted = userRepository.delete(params.id);
      if (!deleted) {
        return status(404, { error: "USER_NOT_FOUND", message: "User not found" });
      }

      return { success: true };
    },
    { auth: true }
  );
