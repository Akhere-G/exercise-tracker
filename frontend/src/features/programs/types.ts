export interface ProgramExercise {
  name: string;
  sets: number;
  reps: number;
}

export interface ProgramDay {
  name: string;
  offset: number;
  exercises: ProgramExercise[];
}

export interface Program {
  slug: string;
  name: string;
  description: string;
  level: "beginner" | "intermediate";
  days: ProgramDay[];
}
