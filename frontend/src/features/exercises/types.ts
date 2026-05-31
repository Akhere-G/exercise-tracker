import { Metrics } from "./schemas";

export interface Muscle {
  name: string;
  contributionType: string;
}
export interface Exercise {
  id: number;
  name: string;
  instructions: string;
  videoUrl: string;
  imageUrl: string;
  metrics: Metrics;
  equipment: string;
  muscles: Muscle[];
}
