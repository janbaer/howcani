import { ItemService } from './item.service';
import { TagService } from './tag.service';

export interface UserSession {
  userId: string;
  username: string;
  itemService: ItemService;
  tagService: TagService;
}

export function createSession(userId: string, username: string): UserSession {
  const tagService = new TagService(userId);
  const itemService = new ItemService(userId, tagService);

  return { userId, username, itemService, tagService };
}
