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

export class AuthService {
  async register(input: RegisterInput): Promise<Result<AuthResult>> {
    // Validate username
    if (!input.username || input.username.length < 3 || input.username.length > 30) {
      return {
        success: false,
        error: { code: "VALIDATION_ERROR", message: "Username must be 3-30 characters" },
      };
    }

    // Validate username format (alphanumeric with hyphens/underscores)
    if (!/^[a-zA-Z0-9_-]+$/.test(input.username)) {
      return {
        success: false,
        error: { code: "VALIDATION_ERROR", message: "Username can only contain letters, numbers, hyphens, and underscores" },
      };
    }

    // Validate password
    if (!input.password || input.password.length < 8) {
      return {
        success: false,
        error: { code: "VALIDATION_ERROR", message: "Password must be at least 8 characters" },
      };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!input.email || !emailRegex.test(input.email)) {
      return {
        success: false,
        error: { code: "VALIDATION_ERROR", message: "Invalid email format" },
      };
    }

    // Check username uniqueness
    if (userRepository.usernameExists(input.username)) {
      return {
        success: false,
        error: { code: "VALIDATION_ERROR", message: "Username already exists" },
      };
    }

    // Check email uniqueness
    if (userRepository.findByEmail(input.email)) {
      return {
        success: false,
        error: { code: "VALIDATION_ERROR", message: "Email already exists" },
      };
    }

    // Create user
    const passwordHash = await hashPassword(input.password);
    const user = userRepository.create({
      username: input.username,
      email: input.email,
      passwordHash,
    });

    // Generate token
    const tokenPayload = {
      userId: user.id,
      username: user.username,
      email: user.email,
    };

    const token = await createToken(tokenPayload);

    return {
      success: true,
      data: {
        user: sanitizeUser(user),
        token,
      },
    };
  }

  async login(input: LoginInput): Promise<Result<AuthResult>> {
    if (!input.username || !input.password) {
      return {
        success: false,
        error: { code: "UNAUTHORIZED", message: "Invalid credentials" },
      };
    }

    // Find user by username
    const user = userRepository.findByUsername(input.username);

    if (!user) {
      return {
        success: false,
        error: { code: "UNAUTHORIZED", message: "Invalid credentials" },
      };
    }

    // Verify password
    const isValid = await verifyPassword(input.password, user.password_hash);
    if (!isValid) {
      return {
        success: false,
        error: { code: "UNAUTHORIZED", message: "Invalid credentials" },
      };
    }

    // Generate token
    const tokenPayload = {
      userId: user.id,
      username: user.username,
      email: user.email,
    };

    const token = await createToken(tokenPayload);

    return {
      success: true,
      data: {
        user: sanitizeUser(user),
        token,
      },
    };
  }

  async getCurrentUser(accessToken: string): Promise<Result<Omit<User, "password_hash">>> {
    const payload = await verifyToken(accessToken);

    if (!payload) {
      return {
        success: false,
        error: { code: "INVALID_TOKEN", message: "Invalid or expired token" },
      };
    }

    const user = userRepository.findById(payload.userId);
    if (!user) {
      return {
        success: false,
        error: { code: "USER_NOT_FOUND", message: "User not found" },
      };
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
