import { SignJWT, jwtVerify } from "jose";
import type { JWTPayload } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "development-secret-change-in-production";
const secret = new TextEncoder().encode(JWT_SECRET);

const TOKEN_EXPIRATION = "7d";

export interface TokenPayload extends JWTPayload {
  userId: string;
  username: string;
  email: string;
}

export async function createToken(
  payload: Omit<TokenPayload, "iat" | "exp">
): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(TOKEN_EXPIRATION)
    .setIssuedAt()
    .sign(secret);
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const verified = await jwtVerify(token, secret);
    return verified.payload as TokenPayload;
  } catch {
    return null;
  }
}

export function extractBearerToken(authHeader?: string): string | null {
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.substring(7);
}
