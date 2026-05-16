import { api } from "@/src/lib/axios";
import type { Routine } from "./types";
import { keysToCamel, keysToSnake } from "@/src/lib/apiUtils";
import { RoutineSchema } from "./schema";
import { isValidationError } from "../auth/utils";

export const routinesApi = {
  getAll: async (): Promise<Routine[]> => {
    const response = await api.get<Routine[]>("/routines");
    return keysToCamel(response.data);
  },

  getById: async (id: number): Promise<Routine> => {
    const response = await api.get<Routine>(`/routines/${id}`);
    return keysToCamel(response.data);
  },
  create: async (routine: RoutineSchema): Promise<Routine> => {
    try {
      const response = await api.post<Routine>(
        "/routines",
        keysToSnake(routine),
      );
      return keysToCamel(response.data);
    } catch (err) {
      if (isValidationError(err)) {
        throw err;
      }
      throw err;
    }
  },
};
