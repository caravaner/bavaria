"use server";

import { redirect } from "next/navigation";
import { db, hashPassword, verifyPassword } from "@bavaria/db";
import {
  createSession,
  destroySession,
  requireAdmin,
} from "@/lib/session";

export type LoginState = { error?: string };

export async function login(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!username || !password) {
    return { error: "Enter your username and password." };
  }

  const user = await db.adminUser.findUnique({ where: { username } });
  // Always run a verify to keep timing roughly constant whether or not the
  // user exists.
  const ok = user
    ? verifyPassword(password, user.passwordHash)
    : verifyPassword(password, "scrypt$32768$8$1$00$00");

  if (!user || !ok) {
    return { error: "Invalid username or password." };
  }

  await createSession(user.id);
  redirect("/");
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/login");
}

export type PasswordState = { error?: string; success?: boolean };

export async function changePassword(
  _prev: PasswordState,
  formData: FormData,
): Promise<PasswordState> {
  const admin = await requireAdmin();

  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (!verifyPassword(current, admin.passwordHash)) {
    return { error: "Current password is incorrect." };
  }
  if (next.length < 8) {
    return { error: "New password must be at least 8 characters." };
  }
  if (next !== confirm) {
    return { error: "New passwords don't match." };
  }

  await db.adminUser.update({
    where: { id: admin.id },
    data: { passwordHash: hashPassword(next) },
  });
  return { success: true };
}
