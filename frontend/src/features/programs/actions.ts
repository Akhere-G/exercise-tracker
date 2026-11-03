"use server";
import { revalidatePath } from "next/cache";
import { api, handleApiError } from "@/src/lib/axios";
import { ActionResponse } from "@/src/lib/apiTypes";
import { Routine } from "../routines/types";

export const applyProgram = async (
  slug: string,
  startDay: number,
): Promise<ActionResponse<Routine[]>> => {
  try {
    const response = await api.post<Routine[]>(`/programs/${slug}/apply`, {
      startDay,
    });
    revalidatePath("/routines");
    return { success: true, data: response.data };
  } catch (err) {
    return handleApiError<Routine[]>(err);
  }
};
