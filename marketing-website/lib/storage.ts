/**
 * File storage.
 *
 * Writes to the local disk at .data/uploads/. In production, point this at
 * Supabase Storage (or S3) instead — the call sites only need `saveFile` to
 * return a path/URL and `readFile` to return the bytes back, so swapping the
 * implementation here is enough; nothing else in the app needs to change.
 */

import { mkdir, readFile as fsReadFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const ROOT = process.env.UPLOADS_DIR || ".data/uploads";

export async function saveFile(applicationId: string, filename: string, bytes: Buffer): Promise<string> {
  const dir = join(/* turbopackIgnore: true */ ROOT, applicationId);
  await mkdir(dir, { recursive: true });
  const safeName = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;
  const path = join(dir, safeName);
  await writeFile(path, bytes);
  return path;
}

export async function readFile(path: string): Promise<Buffer> {
  return fsReadFile(path);
}
