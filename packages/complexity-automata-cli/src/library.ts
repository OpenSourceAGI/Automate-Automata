/**
 * The CLI's shelf of saved universes, kept in `~/.complexity-automata/universes.json`
 * so a universe saved in the terminal survives the session.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { UniverseLibrary, type UniverseStorage } from 'complexity-automata';

/** Where saved universes live, overridable with `COMPLEXITY_AUTOMATA_HOME`. */
export function libraryPath(): string {
  const home = process.env.COMPLEXITY_AUTOMATA_HOME ?? join(homedir(), '.complexity-automata');
  return join(home, 'universes.json');
}

/** A {@link UniverseStorage} backed by a single JSON file. */
export function fileStorage(path = libraryPath()): UniverseStorage {
  return {
    getItem(): string | null {
      try {
        return existsSync(path) ? readFileSync(path, 'utf8') : null;
      } catch {
        return null;
      }
    },
    setItem(_key, value): void {
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, value, 'utf8');
    },
    removeItem(): void {
      if (existsSync(path)) writeFileSync(path, '[]', 'utf8');
    },
  };
}

/** The saved-universe library for this machine. */
export function openLibrary(path = libraryPath()): UniverseLibrary {
  return new UniverseLibrary(fileStorage(path), 'universes');
}
