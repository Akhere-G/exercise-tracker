"use server";

import { LoginSchema, RegisterSchema, Token } from "@/src/features/auth/schema";
import { ActionResponse } from "@/src/lib/apiTypes";
import { api, handleApiError } from "@/src/lib/axios";
import { cookies } from "next/headers";

export async function loginAction(
  formData: LoginSchema,
): Promise<ActionResponse<Token>> {
  try {
    const response = await api.post("/auth/login", formData);
    const token: Token = response.data;

    const cookieStore = await cookies();
    cookieStore.set("access_token", token.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 3600,
      path: "/",
    });

    return { success: true, data: token };
  } catch (err) {
    return handleApiError<Token>(err);
  }
}

export async function registerAction(
  formData: RegisterSchema,
): Promise<ActionResponse<Token>> {
  try {
    const response = await api.post("/auth/register", formData);
    const token: Token = response.data;

    const cookieStore = await cookies();
    cookieStore.set("access_token", token.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 3600,
      path: "/",
    });

    return { success: true, data: token };
  } catch (err) {
    return handleApiError<Token>(err);
  }
}
