export interface ProgressLog {
  id: string;
  userId: string;
  date: string;
  weightKg: number;
  bodyFatPct?: number;
  notes?: string;
}

export interface LogWeightInput {
  weightKg: number;
  date?: string;
  bodyFatPct?: number;
  notes?: string;
}
