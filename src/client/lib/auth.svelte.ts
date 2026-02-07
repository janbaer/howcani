import { auth, setAccessToken, type User } from "./api";
import { navigate } from "./router.svelte";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const state: AuthState = $state({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
});

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

export async function logout(): Promise<void> {
  setAccessToken(null);
  state.user = null;
  state.isAuthenticated = false;
  state.error = null;
  navigate("/login");
}

export async function checkAuth(): Promise<void> {
  state.isLoading = true;

  const userResult = await auth.me();

  if (userResult.data) {
    state.user = userResult.data;
    state.isAuthenticated = true;
  } else {
    state.user = null;
    state.isAuthenticated = false;
  }

  state.isLoading = false;
}

export function clearError(): void {
  state.error = null;
}
