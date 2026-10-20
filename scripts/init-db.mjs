import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const databasePath = resolve(process.env.DATABASE_PATH ?? './data/image-studio.sqlite');
mkdirSync(dirname(databasePath), { recursive: true });

const database = new DatabaseSync(databasePath);
database.exec(readFileSync(new URL('../db/001-initial.sql', import.meta.url), 'utf8'));
database.close();
console.log(`Initialized ${databasePath}`);
