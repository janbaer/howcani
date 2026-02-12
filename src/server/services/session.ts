import { ItemService } from './item.service';
import { TagService } from './tag.service';

export interface UserSession {
  userId: string;
  username: string;
  itemService: ItemService;
  tagService: TagService;
}

let currentSession: UserSession | null = null;

export function initSession(userId: string, username: string): UserSession {
  const tagService = new TagService(userId);
  const itemService = new ItemService(userId, tagService);

  currentSession = { userId, username, itemService, tagService };
  return currentSession;
}

export function getSession(): UserSession {
  if (!currentSession) {
    throw new Error('No active session');
  }
  return currentSession;
}

export function hasSession(): boolean {
  return currentSession !== null;
}

export function clearSession(): void {
  currentSession = null;
}
