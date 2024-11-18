class SidebarStore {
  #isActive = $state(false);

  get active() {
    return this.#isActive;
  }

  set active(value) {
    this.#isActive = value;
  }

  toggle() {
    this.#isActive = !this.#isActive;
  }
}

export default new SidebarStore();
