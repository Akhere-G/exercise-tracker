"use server";
import { revalidatePath } from "next/cache";
import { api, handleApiError } from "@/src/lib/axios";
import { ActionResponse } from "@/src/lib/apiTypes";
import { BodyWeight } from "./types";

export const saveBodyWeight = async (
  measuredOn: string,
  weightKg: number,
): Promise<ActionResponse<BodyWeight>> => {
  try {
    const response = await api.put<BodyWeight>("/body/weights", {
      measuredOn,
      weightKg,
    });
    revalidatePath("/body");
    return { success: true, data: response.data };
  } catch (err) {
    return handleApiError<BodyWeight>(err);
  }
};

export const deleteBodyWeight = async (
  entryId: number,
): Promise<ActionResponse<number>> => {
  try {
    await api.delete(`/body/weights/${entryId}`);
    revalidatePath("/body");
    return { success: true, data: entryId };
  } catch (err) {
    return handleApiError<number>(err);
  }
};
