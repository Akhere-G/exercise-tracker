import { api, handleApiError } from "@/src/lib/axios";
import { Achievement, UserAchievement } from "./type";
import { ActionResponse } from "@/src/lib/apiTypes";

export async function getAchievements(): Promise<
  ActionResponse<Achievement[]>
> {
  try {
    const response = await api.get<Achievement[]>("/achievements");
    return { success: true, data: response.data };
  } catch (err) {
    return handleApiError<Achievement[]>(err);
  }
}

export async function getUserAchievements(): Promise<
  ActionResponse<UserAchievement[]>
> {
  try {
    const response = await api.get<UserAchievement[]>("/achievements/user");
    return { success: true, data: response.data };
  } catch (err) {
    return handleApiError<UserAchievement[]>(err);
  }
}

export async function getUserAchievementsForExercise(
  exerciseId: number,
): Promise<ActionResponse<UserAchievement[]>> {
  try {
    const response = await api.get<UserAchievement[]>(
      `/achievements/exercise/${exerciseId}`,
    );
    return { success: true, data: response.data };
  } catch (err) {
    return handleApiError<UserAchievement[]>(err);
  }
}

export async function getUserAchievementsForWorkout(
  workoutId: number,
): Promise<ActionResponse<UserAchievement[]>> {
  try {
    const response = await api.get<UserAchievement[]>(
      `/achievements/workout/${workoutId}`,
    );
    return { success: true, data: response.data };
  } catch (err) {
    return handleApiError<UserAchievement[]>(err);
  }
}
