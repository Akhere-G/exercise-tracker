import { api } from "@/src/lib/axios";
import type { Routine } from "./types";
import { keysToCamel } from "@/src/lib/apiUtils";

export const routinesApi = {
  getAll: async (): Promise<Routine[]> => {
    const response = await api.get<Routine[]>("/routines");
    return keysToCamel(response.data);
  },

  getById: async (id: number): Promise<Routine> => {
    const response = await api.get<Routine>(`/routines/${id}`);
    return keysToCamel(response.data);
  },
};
