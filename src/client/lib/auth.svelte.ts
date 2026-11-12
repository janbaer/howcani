import { type AuthProvider, auth, setAccessToken, type User } from './api';
import { navigate } from './router.svelte';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  provider: AuthProvider;
}

const state: AuthState = $state({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  provider: 'local',
});

const SSO_ERRORS: Record<string, string> = {
  OIDC_UNAVAILABLE: 'The login provider is not reachable, try again later',
  UNKNOWN_USER: 'Your SSO account is not linked to a HowCanI user',
  OIDC_FAILED: 'The SSO login could not be completed, try again',
};

function consumeLoginFragment(): boolean {
  const params = new URLSearchParams(location.hash.slice(1));
  const token = params.get('token');
  const error = params.get('error');
  if (!token && !error) return false;

  history.replaceState(history.state, '', location.pathname + location.search);
  if (token) {
    setAccessToken(token);
    return true;
  }
  state.error = SSO_ERRORS[error ?? ''] ?? 'The SSO login failed';
  return false;
}

export function getAuthState() {
  return state;
}

export async function login(username: string, password: string): Promise<boolean> {
  state.isLoading = true;
  state.error = null;

  const result = await auth.login(username, password);

  if (result.error) {
    state.error = result.error.message;
    state.isLoading = false;
    return false;
  }

  if (result.data) {
    setAccessToken(result.data.token);
    state.user = result.data.user;
    state.isAuthenticated = true;
    state.isLoading = false;
    navigate(`/${result.data.user.username}/items`);
    return true;
  }

  state.isLoading = false;
  return false;
}

export async function register(username: string, email: string, password: string): Promise<boolean> {
  state.isLoading = true;
  state.error = null;

  const result = await auth.register(username, email, password);

  if (result.error) {
    state.error = result.error.message;
    state.isLoading = false;
    return false;
  }

  if (result.data) {
    setAccessToken(result.data.token);
    state.user = result.data.user;
    state.isAuthenticated = true;
    state.isLoading = false;
    navigate(`/${result.data.user.username}/items`);
    return true;
  }

  state.isLoading = false;
  return false;
}

export function startSsoLogin(): void {
  location.assign('/api/auth/oidc/login');
}

export async function logout(): Promise<void> {
  setAccessToken(null);
  state.user = null;
  state.isAuthenticated = false;
  state.error = null;
  navigate('/');
}

export async function checkAuth(): Promise<void> {
  state.isLoading = true;
  const signedInViaSso = consumeLoginFragment();

  const [configResult, userResult] = await Promise.all([auth.config(), auth.me()]);
  state.provider = configResult.data?.provider ?? 'local';

  if (userResult.data) {
    state.user = userResult.data;
    state.isAuthenticated = true;
    if (signedInViaSso) navigate(`/${userResult.data.username}/items`);
  } else {
    state.user = null;
    state.isAuthenticated = false;
  }

  state.isLoading = false;
}

export function clearError(): void {
  state.error = null;
}
