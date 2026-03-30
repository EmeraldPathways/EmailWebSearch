import fs from 'fs/promises';
import path from 'path';

/**
 * Reads a JSON file. Returns null if the file does not exist.
 * Throws on malformed JSON or other I/O errors.
 */
export async function readJsonFile<T>(filePath: string): Promise<T | null> {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw) as T;
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw err;
  }
}

/**
 * Writes a JSON file. Creates parent directories as needed.
 * Uses a .tmp-then-rename pattern to reduce corruption risk on crash.
 * On Windows, unlinks the destination before renaming (rename fails if dest exists).
 */
export async function writeJsonFile<T>(filePath: string, data: T): Promise<void> {
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });

  const tmp = `${filePath}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), 'utf8');

  // Windows: fs.rename throws if dest exists
  try {
    await fs.unlink(filePath);
  } catch {
    // ENOENT is fine — destination simply didn't exist
  }

  await fs.rename(tmp, filePath);
}

/**
 * Lists all .json filenames (basename only) in a directory.
 * Returns [] if the directory does not exist.
 */
export async function listJsonFiles(dir: string): Promise<string[]> {
  try {
    const entries = await fs.readdir(dir);
    return entries.filter((f) => f.endsWith('.json'));
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw err;
  }
}
