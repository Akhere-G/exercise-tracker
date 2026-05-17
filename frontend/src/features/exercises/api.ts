"use server";
import { api } from "@/src/lib/axios";
import type { Exercise } from "./types";
import { keysToCamel } from "@/src/lib/apiUtils";

interface GetAllExercisesProps {
  search?: string;
  equipment?: string;
  muscle?: string;
  page?: number;
}
export const getAllExercises = async (
  params: GetAllExercisesProps,
): Promise<Exercise[]> => {
  const searchParams = new URLSearchParams(params as Record<string, string>);
  const response = await api.get<Exercise[]>(
    "/exercises?" + searchParams.toString(),
  );
  return keysToCamel(response.data);
};
export const getExerciseById = async (id: number): Promise<Exercise> => {
  const response = await api.get<Exercise>(`/exercises/${id}`);
  return keysToCamel(response.data);
};
