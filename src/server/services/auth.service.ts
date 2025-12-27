import { userRepository, type User } from "../repositories";
import {
  hashPassword,
  verifyPassword,
  createAccessToken,
  createRefreshToken,
  verifyToken,
  type TokenPayload,
} from "../auth";

export interface RegisterInput {
  username: string;
  email: string;
  password: string;
  displayName?: string;
}

export interface LoginInput {
  login: string; // username or email
  password: string;
}

export interface AuthResult {
  user: Omit<User, "password_hash">;
  accessToken: string;
  refreshToken: string;
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
    // Validate input
    if (!input.username || input.username.length < 3 || input.username.length > 20) {
      return {
        success: false,
        error: { code: "INVALID_USERNAME", message: "Username must be 3-20 characters" },
      };
    }

    if (!input.email || !input.email.includes("@")) {
      return {
        success: false,
        error: { code: "INVALID_EMAIL", message: "Invalid email address" },
      };
    }

    if (!input.password || input.password.length < 8) {
      return {
        success: false,
        error: { code: "INVALID_PASSWORD", message: "Password must be at least 8 characters" },
      };
    }

    // Check uniqueness
    if (userRepository.usernameExists(input.username)) {
      return {
        success: false,
        error: { code: "USERNAME_TAKEN", message: "Username is already taken" },
      };
    }

    if (userRepository.emailExists(input.email)) {
      return {
        success: false,
        error: { code: "EMAIL_TAKEN", message: "Email is already registered" },
      };
    }

    // Create user
    const passwordHash = await hashPassword(input.password);
    const user = userRepository.create({
      username: input.username,
      email: input.email,
      passwordHash,
      displayName: input.displayName,
    });

    // Generate tokens
    const tokenPayload = {
      userId: user.id,
      username: user.username,
      email: user.email,
    };

    const [accessToken, refreshToken] = await Promise.all([
      createAccessToken(tokenPayload),
      createRefreshToken(tokenPayload),
    ]);

    return {
      success: true,
      data: {
        user: sanitizeUser(user),
        accessToken,
        refreshToken,
      },
    };
  }

  async login(input: LoginInput): Promise<Result<AuthResult>> {
    if (!input.login || !input.password) {
      return {
        success: false,
        error: { code: "INVALID_CREDENTIALS", message: "Invalid credentials" },
      };
    }

    // Find user by username or email
    const user = input.login.includes("@")
      ? userRepository.findByEmail(input.login)
      : userRepository.findByUsername(input.login);

    if (!user) {
      return {
        success: false,
        error: { code: "INVALID_CREDENTIALS", message: "Invalid credentials" },
      };
    }

    // Verify password
    const isValid = await verifyPassword(input.password, user.password_hash);
    if (!isValid) {
      return {
        success: false,
        error: { code: "INVALID_CREDENTIALS", message: "Invalid credentials" },
      };
    }

    // Generate tokens
    const tokenPayload = {
      userId: user.id,
      username: user.username,
      email: user.email,
    };

    const [accessToken, refreshToken] = await Promise.all([
      createAccessToken(tokenPayload),
      createRefreshToken(tokenPayload),
    ]);

    return {
      success: true,
      data: {
        user: sanitizeUser(user),
        accessToken,
        refreshToken,
      },
    };
  }

  async refresh(refreshToken: string): Promise<Result<{ accessToken: string }>> {
    const payload = await verifyToken(refreshToken);

    if (!payload) {
      return {
        success: false,
        error: { code: "INVALID_TOKEN", message: "Invalid or expired refresh token" },
      };
    }

    // Verify user still exists
    const user = userRepository.findById(payload.userId);
    if (!user) {
      return {
        success: false,
        error: { code: "USER_NOT_FOUND", message: "User not found" },
      };
    }

    // Generate new access token
    const accessToken = await createAccessToken({
      userId: user.id,
      username: user.username,
      email: user.email,
    });

    return {
      success: true,
      data: { accessToken },
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
