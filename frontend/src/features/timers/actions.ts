"use server";
import { api, handleApiError } from "@/src/lib/axios";
import { ActionResponse } from "@/src/lib/apiTypes";

export async function startTimer(
  durationSeconds: number
): Promise<ActionResponse<{ task_id: string; duration_seconds: number }>> {
  try {
    const response = await api.post("/timers/start", { duration_seconds: durationSeconds });
    return { success: true, data: response.data };
  } catch (err) {
    return handleApiError(err);
  }
}

export async function cancelTimer(): Promise<ActionResponse<{ cancelled: number }>> {
  try {
    const response = await api.delete("/timers/cancel");
    return { success: true, data: response.data };
  } catch (err) {
    return handleApiError(err);
  }
}

export async function modifyTimer(
  durationSeconds: number
): Promise<ActionResponse<{ task_id: string; duration_seconds: number }>> {
  try {
    const response = await api.post("/timers/modify", { duration_seconds: durationSeconds });
    return { success: true, data: response.data };
  } catch (err) {
    return handleApiError(err);
  }
}
