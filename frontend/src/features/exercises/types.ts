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
  metrics: string;
  equipment: string;
  muscles: Muscle[];
}
