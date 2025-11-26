import { mount } from 'svelte';
import App from './app.svelte';
import './global.css';

const app = mount(App, { target: window.document.getElementById('app')});

export default app;
