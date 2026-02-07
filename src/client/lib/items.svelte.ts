import { type Item, type ItemListParams, type ItemListResponse, items } from "./api";

export type { Item };

export async function fetchItems(username: string, params: ItemListParams = {}): Promise<ItemListResponse> {
  const result = await items.list(username, params);
  if (result.error || !result.data) {
    throw new Error(result.error?.message ?? "Failed to load items");
  }
  return result.data;
}

export async function fetchItem(username: string, id: string): Promise<Item> {
  const result = await items.getById(username, id);
  if (result.error || !result.data) {
    throw new Error(result.error?.message ?? "Item not found");
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

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
