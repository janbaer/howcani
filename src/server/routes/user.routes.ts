import { Elysia, t } from "elysia";
import { StatusCodes } from "http-status-codes";
import { userRepository } from "../repositories";
import { authPlugin } from "../middleware";
import { validateUsername, validateEmail } from "../domain/user";

export const userRoutes = new Elysia({ prefix: "/users" })
  .use(authPlugin)
  .get(
    "/:id",
    ({ params, status }) => {
      const user = userRepository.findById(params.id);

      if (!user) {
        return status(StatusCodes.NOT_FOUND, { error: "USER_NOT_FOUND", message: "User not found" });
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
        return status(StatusCodes.FORBIDDEN, { error: "FORBIDDEN", message: "You can only update your own profile" });
      }

      const existingUser = userRepository.findById(params.id);
      if (!existingUser) {
        return status(StatusCodes.NOT_FOUND, { error: "USER_NOT_FOUND", message: "User not found" });
      }

      if (body.username) {
        const usernameValidation = validateUsername(body.username);
        if (!usernameValidation.valid) {
          return status(StatusCodes.BAD_REQUEST, {
            error: "VALIDATION_ERROR",
            message: usernameValidation.errors.join(", "),
          });
        }

        if (body.username !== existingUser.username && userRepository.usernameExists(body.username)) {
          return status(StatusCodes.BAD_REQUEST, { error: "USERNAME_TAKEN", message: "Username is already taken" });
        }
      }

      if (body.email) {
        const emailValidation = validateEmail(body.email);
        if (!emailValidation.valid) {
          return status(StatusCodes.BAD_REQUEST, {
            error: "VALIDATION_ERROR",
            message: emailValidation.errors.join(", "),
          });
        }

        if (body.email !== existingUser.email && userRepository.emailExists(body.email)) {
          return status(StatusCodes.BAD_REQUEST, { error: "EMAIL_TAKEN", message: "Email is already registered" });
        }
      }

      const updated = userRepository.update(params.id, body);
      if (!updated) {
        return status(StatusCodes.INTERNAL_SERVER_ERROR, { error: "UPDATE_FAILED", message: "Failed to update user" });
      }

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password_hash: _, ...safeUser } = updated;
      return safeUser;
    },
    {
      auth: true,
      body: t.Object({
        username: t.Optional(t.String({ minLength: 3, maxLength: 30 })),
        email: t.Optional(t.String({ format: "email" })),
      }),
    }
  )
  .delete(
    "/:id",
    ({ params, user, status }) => {
      if (user!.userId !== params.id) {
        return status(StatusCodes.FORBIDDEN, { error: "FORBIDDEN", message: "You can only delete your own account" });
      }

      const deleted = userRepository.delete(params.id);
      if (!deleted) {
        return status(StatusCodes.NOT_FOUND, { error: "USER_NOT_FOUND", message: "User not found" });
      }

      return { success: true };
    },
    { auth: true }
  );
