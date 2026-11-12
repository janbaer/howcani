import type { JWTPayload } from 'jose';
import { jwtVerify, SignJWT } from 'jose';
import { getConfig } from '../config/config.service';

const HOWCANI_JWT_SECRET = process.env.HOWCANI_JWT_SECRET;
if (!HOWCANI_JWT_SECRET) {
  throw new Error('HOWCANI_JWT_SECRET environment variable is required');
}
const secret = new TextEncoder().encode(HOWCANI_JWT_SECRET);

export type TokenKind = 'login' | 'api';

export interface TokenPayload extends JWTPayload {
  userId: string;
  username: string;
  email: string;
  kind?: TokenKind;
}

type TokenClaims = Omit<TokenPayload, 'iat' | 'exp' | 'kind'>;

export async function createToken(payload: TokenClaims): Promise<string> {
  return new SignJWT({ ...payload, kind: 'login' })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(getConfig().auth.tokenExpiration)
    .setIssuedAt()
    .sign(secret);
}

export async function createApiToken(payload: TokenClaims, days: number): Promise<string> {
  return new SignJWT({ ...payload, kind: 'api' })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(`${days}d`)
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
  if (!authHeader?.startsWith('Bearer ')) return null;
  return authHeader.substring(7);
}
