"use server";
import { api } from "@/src/lib/axios";
import type { RankedExercise } from "./types";

interface GetAllExercisesProps {
  search?: string;
  equipment?: string;
  muscle?: string;
  page?: number;
}
export const getAllExercises = async (
  params: GetAllExercisesProps,
): Promise<RankedExercise[]> => {
  const searchParams = new URLSearchParams(params as Record<string, string>);
  const response = await api.get<RankedExercise[]>(
    "/exercises?" + searchParams.toString(),
  );
  return response.data;
};
