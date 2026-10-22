"use server";

import { LoginSchema, RegisterSchema, Token } from "@/src/features/auth/schema";
import { ActionResponse } from "@/src/lib/apiTypes";
import { api, handleApiError } from "@/src/lib/axios";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const SESSION_SECS = 60 * 60 * 24 * 7;
const DEMO_SESSION_SECS = 60 * 60 * 2;

async function setAccessToken(token: Token, maxAge = SESSION_SECS) {
  const cookieStore = await cookies();
  cookieStore.set("access_token", token.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge,
    path: "/",
  });
}

export async function loginAction(
  formData: LoginSchema,
): Promise<ActionResponse<null>> {
  try {
    const response = await api.post("/auth/login", formData);
    const token: Token = response.data;

    await setAccessToken(token);

    return { success: true, data: null };
  } catch (err) {
    return handleApiError<null>(err);
  }
}

export async function registerAction(
  formData: RegisterSchema,
): Promise<ActionResponse<null>> {
  try {
    const response = await api.post("/auth/register", formData);
    const token: Token = response.data;

    await setAccessToken(token);

    return { success: true, data: null };
  } catch (err) {
    return handleApiError<null>(err);
  }
}

export async function demoLoginAction(): Promise<ActionResponse<null>> {
  try {
    const response = await api.post("/auth/demo");
    const token: Token = response.data;

    await setAccessToken(token, DEMO_SESSION_SECS);
    const cookieStore = await cookies();
    cookieStore.set("demo_session", "1", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: DEMO_SESSION_SECS,
      path: "/",
    });

    return { success: true, data: null };
  } catch (err) {
    return handleApiError<null>(err);
  }
}

export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete("access_token");
  cookieStore.delete("demo_session");
  redirect("/");
}
