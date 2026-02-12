import {
  type Item,
  type ItemCreateData,
  type ItemListParams,
  type ItemListResponse,
  type ItemUpdateData,
  items,
  type TagWithCount,
  tags,
} from './api';

export type { Item, ItemCreateData, ItemUpdateData, TagWithCount };

export async function fetchItems(username: string, params: ItemListParams = {}): Promise<ItemListResponse> {
  const result = await items.list(username, params);
  if (result.error || !result.data) {
    throw new Error(result.error?.message ?? 'Failed to load questions');
  }
  return result.data;
}

export async function fetchItem(username: string, id: string): Promise<Item> {
  const result = await items.getById(username, id);
  if (result.error || !result.data) {
    throw new Error(result.error?.message ?? 'Question not found');
  }
  return result.data.item;
}

export async function createItem(username: string, data: ItemCreateData): Promise<Item> {
  const result = await items.create(username, data);
  if (result.error || !result.data) {
    throw new Error(result.error?.message ?? 'Failed to create question');
  }
  return result.data.item;
}

export async function updateItem(username: string, id: string, data: ItemUpdateData): Promise<Item> {
  const result = await items.update(username, id, data);
  if (result.error || !result.data) {
    throw new Error(result.error?.message ?? 'Failed to update question');
  }
  return result.data.item;
}

export async function deleteItem(username: string, id: string): Promise<void> {
  const result = await items.delete(username, id);
  if (result.error || !result.data) {
    throw new Error(result.error?.message ?? 'Failed to delete question');
  }
}

export function truncateAnswer(answer: string, maxLen = 200): string {
  if (!answer || answer.length <= maxLen) return answer || '';
  const plain = answer.replace(/[#*`_~[\]]/g, '').replace(/\n+/g, ' ');
  if (plain.length <= maxLen) return plain;
  const truncated = plain.substring(0, maxLen);
  const lastSpace = truncated.lastIndexOf(' ');
  return `${lastSpace > maxLen * 0.6 ? truncated.substring(0, lastSpace) : truncated}...`;
}

export async function fetchTags(username: string): Promise<TagWithCount[]> {
  const result = await tags.list(username);
  if (result.error || !result.data) {
    throw new Error(result.error?.message ?? 'Failed to load tags');
  }
  return result.data.tags;
}

export function extractCodePreview(answer: string): string | null {
  if (!answer) return null;
  // Only match fenced code blocks (triple backticks), not inline code
  const match = answer.match(/```[\w]*\n([\s\S]*?)```/);
  if (match?.[1]) {
    const code = match[1].trim();
    const lines = code.split('\n').slice(0, 4);
    return lines.join('\n');
  }
  return null;
}

export function extractTextBeforeCode(answer: string): string | null {
  if (!answer) return null;
  const codeBlockMatch = answer.match(/```/);
  if (!codeBlockMatch) return null;
  let textBefore = answer.substring(0, codeBlockMatch.index).trim();
  if (!textBefore) return null;

  // Remove markdown formatting for cleaner preview
  textBefore = textBefore.replace(/[*_`]/g, '');

  // Truncate if too long, but break at sentence or word boundary
  if (textBefore.length > 120) {
    const truncated = textBefore.substring(0, 120);
    // Try to break at sentence end
    const lastPeriod = truncated.lastIndexOf('.');
    if (lastPeriod > 60) {
      return truncated.substring(0, lastPeriod + 1);
    }
    // Otherwise break at word boundary
    const lastSpace = truncated.lastIndexOf(' ');
    if (lastSpace > 60) {
      return `${truncated.substring(0, lastSpace)}...`;
    }
    return `${truncated}...`;
  }
  return textBefore;
}

export function formatTimestamp(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export async function updateTag(username: string, id: string, data: { name?: string; color?: string }) {
  const result = await tags.update(username, id, data);
  if (result.error || !result.data) {
    throw new Error(result.error?.message ?? 'Failed to update tag');
  }
  return result.data.tag;
}

export async function deleteTag(username: string, id: string) {
  const result = await tags.delete(username, id);
  if (result.error || !result.data) {
    throw new Error(result.error?.message ?? 'Failed to delete tag');
  }
  return result.data;
}
