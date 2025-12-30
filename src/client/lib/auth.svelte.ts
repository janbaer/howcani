import { auth, setAccessToken, type User } from "./api";
import { navigate } from "./router.svelte";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

let state = $state<AuthState>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
});

export function getAuthState() {
  return state;
}

export async function login(login: string, password: string): Promise<boolean> {
  state.isLoading = true;
  state.error = null;

  const result = await auth.login(login, password);

  if (result.error) {
    state.error = result.error.message;
    state.isLoading = false;
    return false;
  }

  if (result.data) {
    setAccessToken(result.data.accessToken);
    state.user = result.data.user;
    state.isAuthenticated = true;
    state.isLoading = false;
    navigate("/");
    return true;
  }

  state.isLoading = false;
  return false;
}

export async function register(
  username: string,
  password: string
): Promise<boolean> {
  state.isLoading = true;
  state.error = null;

  const result = await auth.register(username, password);

  if (result.error) {
    state.error = result.error.message;
    state.isLoading = false;
    return false;
  }

  if (result.data) {
    setAccessToken(result.data.accessToken);
    state.user = result.data.user;
    state.isAuthenticated = true;
    state.isLoading = false;
    navigate("/");
    return true;
  }

  state.isLoading = false;
  return false;
}

export async function logout(): Promise<void> {
  await auth.logout();
  setAccessToken(null);
  state.user = null;
  state.isAuthenticated = false;
  state.error = null;
  navigate("/login");
}

export async function checkAuth(): Promise<void> {
  state.isLoading = true;

  // Try to refresh the token first
  const refreshResult = await auth.refresh();

  if (refreshResult.data) {
    setAccessToken(refreshResult.data.accessToken);

    // Get user info
    const userResult = await auth.me();

    if (userResult.data) {
      state.user = userResult.data;
      state.isAuthenticated = true;
    }
  }

  state.isLoading = false;
}

export function clearError(): void {
  state.error = null;
}
