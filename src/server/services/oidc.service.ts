import * as client from 'openid-client';
import { getConfig } from '../config/config.service';
import { type AuthError, type AuthResult, authService } from './auth.service';

interface OidcChecks {
  codeVerifier: string;
  state: string;
  nonce: string;
}

type Result<T> = { success: true; data: T } | { success: false; error: AuthError };

const SCOPE = 'openid profile email';

function clientSecret(): string | undefined {
  return process.env.HOWCANI_OIDC_CLIENT_SECRET || undefined;
}

export function assertOidcConfigured(): void {
  if (getConfig().auth.provider === 'oidc' && !clientSecret()) {
    throw new Error('HOWCANI_OIDC_CLIENT_SECRET environment variable is required when auth.provider is "oidc"');
  }
}

function settings() {
  const oidc = getConfig().auth.oidc;
  if (!oidc) throw new Error('auth.oidc is not configured');
  return oidc;
}

export class OidcService {
  private configuration: Promise<client.Configuration> | null = null;

  private discover(): Promise<client.Configuration> {
    if (!this.configuration) {
      const { issuer, clientId } = settings();
      this.configuration = client
        .discovery(new URL(issuer), clientId, undefined, client.ClientSecretPost(clientSecret()))
        .catch((err) => {
          this.configuration = null;
          throw err;
        });
    }
    return this.configuration;
  }

  async startLogin(): Promise<Result<{ url: string; checks: OidcChecks }>> {
    let configuration: client.Configuration;
    try {
      configuration = await this.discover();
    } catch (err) {
      console.error('[oidc] Discovery failed:', err);
      return { success: false, error: { code: 'OIDC_UNAVAILABLE', message: 'The login provider is not reachable' } };
    }

    const checks: OidcChecks = {
      codeVerifier: client.randomPKCECodeVerifier(),
      state: client.randomState(),
      nonce: client.randomNonce(),
    };
    const url = client.buildAuthorizationUrl(configuration, {
      redirect_uri: settings().redirectUri,
      scope: SCOPE,
      code_challenge: await client.calculatePKCECodeChallenge(checks.codeVerifier),
      code_challenge_method: 'S256',
      state: checks.state,
      nonce: checks.nonce,
    });
    return { success: true, data: { url: url.href, checks } };
  }

  async finishLogin(callbackUrl: URL, checks: OidcChecks): Promise<Result<AuthResult>> {
    let username: string | undefined;
    try {
      const configuration = await this.discover();
      const tokens = await client.authorizationCodeGrant(configuration, callbackUrl, {
        pkceCodeVerifier: checks.codeVerifier,
        expectedState: checks.state,
        expectedNonce: checks.nonce,
        idTokenExpected: true,
      });
      const claim = tokens.claims()?.preferred_username;
      username = typeof claim === 'string' ? claim : undefined;
    } catch (err) {
      console.error('[oidc] Callback validation failed:', err);
      return {
        success: false,
        error: { code: 'OIDC_FAILED', message: 'The login provider response could not be validated' },
      };
    }
    return authService.loginExternalUser(username);
  }
}

export const oidcService = new OidcService();
