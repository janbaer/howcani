// Global store for triggering the create question modal
let showCreateModal = $state(false);

export function openCreateModal() {
  showCreateModal = true;
}

export function closeCreateModal() {
  showCreateModal = false;
}

export function getCreateModalState() {
  return {
    get isOpen() {
      return showCreateModal;
    },
  };
}
