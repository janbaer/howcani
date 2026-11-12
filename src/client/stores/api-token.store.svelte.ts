import { auth } from '../lib/api';

export class ApiTokenStore {
  token = $state<string | null>(null);
  creating = $state(false);
  error = $state<string | null>(null);
  copied = $state(false);

  async create(days: number) {
    this.creating = true;
    this.error = null;
    this.token = null;
    this.copied = false;
    const res = await auth.createApiToken(days);
    this.creating = false;
    if (res.data) {
      this.token = res.data.token;
    } else {
      this.error = res.error?.message ?? 'Failed to create API token';
    }
  }

  async copy() {
    if (!this.token) return;
    try {
      await navigator.clipboard.writeText(this.token);
      this.copied = true;
    } catch {
      this.error = 'Copy failed, select the token and copy it manually';
    }
  }
}
