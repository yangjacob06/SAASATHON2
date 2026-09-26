"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "../auth";
import { planFor } from "../billing";
import { run } from "../db";
import { saveFile } from "../storage";

export async function updateProfileAction(formData: FormData) {
  const user = await requireUser();
  const name = String(formData.get("name") || "").trim();
  const firmName = String(formData.get("firm_name") || "").trim();

  await run(`UPDATE users SET name = $1, firm_name = $2 WHERE id = $3`, [name, firmName, user.id]);
  revalidatePath("/app/settings");
}

export async function uploadLogoAction(formData: FormData) {
  const user = await requireUser();
  const plan = planFor(user);
  if (plan?.id !== "pro") return; // Logo on PDF exports is a Pro feature.

  const file = formData.get("logo");
  if (!(file instanceof File) || file.size === 0) return;

  const bytes = Buffer.from(await file.arrayBuffer());
  const path = await saveFile(`logos/${user.id}`, file.name, bytes);
  await run(`UPDATE users SET logo_url = $1 WHERE id = $2`, [path, user.id]);

  revalidatePath("/app/settings");
}
