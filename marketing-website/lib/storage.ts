/**
 * Private document and logo storage.
 *
 * Local development uses .data/uploads. Vercel deployments use private Vercel
 * Blob objects, addressed by pathname and never by a public URL.
 */

import { get, put } from "@vercel/blob";
import { mkdir, readFile as fsReadFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const ROOT = process.env.UPLOADS_DIR || ".data/uploads";

function safeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9.\-_]/g, "_");
}

export async function saveFile(applicationId: string, filename: string, bytes: Buffer): Promise<string> {
  const safeName = `${Date.now()}-${safeFilename(filename)}`;
  if (process.env.VERCEL) {
    const hasBlobCredentials = Boolean(
      process.env.BLOB_READ_WRITE_TOKEN || (process.env.VERCEL_OIDC_TOKEN && process.env.BLOB_STORE_ID),
    );
    if (!hasBlobCredentials) {
      throw new Error("Connect a Vercel Blob store to this project before uploading files.");
    }
    const blob = await put(`${applicationId}/${safeName}`, bytes, {
      access: "private",
      contentType: filename.toLowerCase().endsWith(".pdf")
        ? "application/pdf"
        : filename.toLowerCase().endsWith(".png")
          ? "image/png"
          : filename.toLowerCase().endsWith(".csv")
            ? "text/csv"
            : "application/octet-stream",
    });
    return blob.pathname;
  }

  const dir = join(ROOT, applicationId);
  await mkdir(dir, { recursive: true });
  const path = join(dir, safeName);
  await writeFile(path, bytes);
  return path;
}

export async function readFile(path: string): Promise<Buffer> {
  if (process.env.VERCEL) {
    const result = await get(path, { access: "private", useCache: false });
    if (!result?.stream) throw new Error("Stored file was not found.");
    return Buffer.from(await new Response(result.stream).arrayBuffer());
  }
  return fsReadFile(path);
}
