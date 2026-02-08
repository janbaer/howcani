import { type Item, type ItemListParams, type ItemListResponse, items, type TagWithCount, tags } from "./api";

export type { Item, TagWithCount };

export async function fetchItems(username: string, params: ItemListParams = {}): Promise<ItemListResponse> {
  const result = await items.list(username, params);
  if (result.error || !result.data) {
    throw new Error(result.error?.message ?? "Failed to load questions");
  }
  return result.data;
}

export async function fetchItem(username: string, id: string): Promise<Item> {
  const result = await items.getById(username, id);
  if (result.error || !result.data) {
    throw new Error(result.error?.message ?? "Question not found");
  }
  return result.data.item;
}

export function truncateAnswer(answer: string, maxLen = 200): string {
  if (!answer || answer.length <= maxLen) return answer || "";
  const plain = answer.replace(/[#*`_~[\]]/g, "").replace(/\n+/g, " ");
  if (plain.length <= maxLen) return plain;
  const truncated = plain.substring(0, maxLen);
  const lastSpace = truncated.lastIndexOf(" ");
  return `${lastSpace > maxLen * 0.6 ? truncated.substring(0, lastSpace) : truncated}...`;
}

export async function fetchTags(username: string): Promise<TagWithCount[]> {
  const result = await tags.list(username);
  if (result.error || !result.data) {
    throw new Error(result.error?.message ?? "Failed to load tags");
  }
  return result.data.tags;
}

export function extractCodePreview(answer: string): string | null {
  if (!answer) return null;
  const match = answer.match(/```[\w]*\n([\s\S]*?)```/);
  if (match?.[1]) {
    const code = match[1].trim();
    const lines = code.split("\n").slice(0, 4);
    return lines.join("\n");
  }
  const inlineMatch = answer.match(/`([^`]{10,})`/);
  if (inlineMatch?.[1]) return inlineMatch[1];
  return null;
}

export function formatTimestamp(dateStr: string): string {
  return new Date(dateStr).toLocaleString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
