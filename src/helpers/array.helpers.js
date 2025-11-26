export function replaceItemById(items, id, item) {
  const index = items.findIndex((i) => i.id === id);
  if (index < 0) {
    console.warn(`Item ${id} not found in list, update failed.`);
  }
  return items.splice(index, 1, item);
}

export function removeItemById(items, id) {
  const index = items.findIndex((i) => i.id === id);
  if (index < 0) {
    console.warn(`Item ${id} not found in list, update failed.`);
  }
  return items.splice(index, 1);
}
