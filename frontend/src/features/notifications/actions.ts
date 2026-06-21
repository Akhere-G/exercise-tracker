"use server";
import { api, handleApiError } from "@/src/lib/axios";
import { ActionResponse } from "@/src/lib/apiTypes";
import { NotificationCreate } from "./types";

export async function subscribe(
  sub: NotificationCreate,
): Promise<ActionResponse<null>> {
  console.log("clicked!");
  try {
    api.post("/notifications/subscribe", sub);
    return { success: true, data: null };
  } catch (err) {
    return handleApiError(err);
  }
}
