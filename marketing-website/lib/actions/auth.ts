"use server";

import { redirect } from "next/navigation";

import { createSession, createUser, destroySession, findUserByEmail, verifyPassword } from "../auth";

function fail(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

export async function signUpAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const name = String(formData.get("name") || "").trim();
  const firmName = String(formData.get("firm_name") || "").trim();

  if (!email.includes("@")) fail("/signup", "That doesn't look like an email address.");
  if (password.length < 8) fail("/signup", "Your password needs to be at least 8 characters.");
  if (!name) fail("/signup", "Enter your name.");
  if (!firmName) fail("/signup", "Enter your firm or trading name.");

  const existing = await findUserByEmail(email);
  if (existing) fail("/signup", "There's already an account with that email. Try logging in.");

  const user = await createUser({ email, password, name, firmName });
  await createSession(user.id);
  redirect("/app");
}

export async function logInAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  const user = await findUserByEmail(email);
  if (!user || !(await verifyPassword(password, user.password_hash))) {
    fail("/login", "That email and password don't match.");
  }

  await createSession(user.id);
  redirect("/app");
}

export async function logOutAction() {
  await destroySession();
  redirect("/login");
}
