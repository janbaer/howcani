import { userRepository, type User } from "../repositories";
import {
  hashPassword,
  verifyPassword,
  createToken,
  verifyToken,
  type TokenPayload,
} from "../auth";

export interface RegisterInput {
  username: string;
  email: string;
  password: string;
}

export interface LoginInput {
  username: string;
  password: string;
}

export interface AuthResult {
  user: Omit<User, "password_hash">;
  token: string;
}

export interface AuthError {
  code: string;
  message: string;
}

type Result<T> = { success: true; data: T } | { success: false; error: AuthError };

function sanitizeUser(user: User): Omit<User, "password_hash"> {
  const { password_hash: _, ...safeUser } = user;
  return safeUser;
}

function createError(code: string, message: string): { success: false; error: AuthError } {
  return { success: false, error: { code, message } };
}

function validateUsername(username: string): AuthError | null {
  if (!username || username.length < 3 || username.length > 30) {
    return { code: "VALIDATION_ERROR", message: "Username must be 3-30 characters" };
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    return { code: "VALIDATION_ERROR", message: "Username can only contain letters, numbers, hyphens, and underscores" };
  }

  return null;
}

function validatePassword(password: string): AuthError | null {
  if (!password || password.length < 8) {
    return { code: "VALIDATION_ERROR", message: "Password must be at least 8 characters" };
  }
  return null;
}

function validateEmail(email: string): AuthError | null {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return { code: "VALIDATION_ERROR", message: "Invalid email format" };
  }
  return null;
}

async function generateAuthResult(user: User): Promise<AuthResult> {
  const tokenPayload = {
    userId: user.id,
    username: user.username,
    email: user.email,
  };

  const token = await createToken(tokenPayload);

  return {
    user: sanitizeUser(user),
    token,
  };
}

export class AuthService {
  async register(input: RegisterInput): Promise<Result<AuthResult>> {
    const usernameError = validateUsername(input.username);
    if (usernameError) {
      return createError(usernameError.code, usernameError.message);
    }

    const passwordError = validatePassword(input.password);
    if (passwordError) {
      return createError(passwordError.code, passwordError.message);
    }

    const emailError = validateEmail(input.email);
    if (emailError) {
      return createError(emailError.code, emailError.message);
    }

    if (userRepository.usernameExists(input.username)) {
      return createError("VALIDATION_ERROR", "Username already exists");
    }

    if (userRepository.findByEmail(input.email)) {
      return createError("VALIDATION_ERROR", "Email already exists");
    }

    const passwordHash = await hashPassword(input.password);
    const user = userRepository.create({
      username: input.username,
      email: input.email,
      passwordHash,
    });

    return {
      success: true,
      data: await generateAuthResult(user),
    };
  }

  async login(input: LoginInput): Promise<Result<AuthResult>> {
    if (!input.username || !input.password) {
      return createError("UNAUTHORIZED", "Invalid credentials");
    }

    const user = userRepository.findByUsername(input.username);
    if (!user) {
      return createError("UNAUTHORIZED", "Invalid credentials");
    }

    const isValid = await verifyPassword(input.password, user.password_hash);
    if (!isValid) {
      return createError("UNAUTHORIZED", "Invalid credentials");
    }

    return {
      success: true,
      data: await generateAuthResult(user),
    };
  }

  async getCurrentUser(accessToken: string): Promise<Result<Omit<User, "password_hash">>> {
    const payload = await verifyToken(accessToken);
    if (!payload) {
      return createError("INVALID_TOKEN", "Invalid or expired token");
    }

    const user = userRepository.findById(payload.userId);
    if (!user) {
      return createError("USER_NOT_FOUND", "User not found");
    }

    return {
      success: true,
      data: sanitizeUser(user),
    };
  }

  async validateToken(token: string): Promise<TokenPayload | null> {
    return verifyToken(token);
  }

  getUserById(userId: string): Omit<User, "password_hash"> | null {
    const user = userRepository.findById(userId);
    return user ? sanitizeUser(user) : null;
  }
}

export const authService = new AuthService();
