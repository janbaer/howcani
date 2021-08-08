import { writable } from 'svelte/store';

const defaultConfig = { user: '', repository: '' };

let storedConfig = JSON.parse(localStorage.getItem('config'));

export const configStore = writable(storedConfig || defaultConfig);

configStore.subscribe((config) => {
  localStorage.setItem('config', JSON.stringify(config));
});
