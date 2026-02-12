#!/usr/bin/env bun
import { runMigrations } from './migrations';

console.log('[migrate] Starting database migrations...');
runMigrations();
console.log('[migrate] Migrations complete');
