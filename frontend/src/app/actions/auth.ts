// app/actions/auth.ts
"use server";

import { LoginSchema, Token } from "@/src/auth/schema";
import { api } from "@/src/lib/axios";
import { isAxiosError } from "axios";
import { cookies } from "next/headers";

export async function loginAction(formData: LoginSchema) {
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

    return { success: true };
  } catch (err) {
    if (isAxiosError(err)) {
      return {
        success: false,
        error: err.response?.data?.detail || "Login Failed",
      };
    }
    return { success: false, error: "An unexpected error occurred" };
  }
}
