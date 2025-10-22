export type ProjectPhase = 'design' | 'coding' | 'testing' | 'preparation' | 'live';

export interface ScheduleHistory {
  timestamp: string;
  phase?: ProjectPhase;
  status?: string;
  progress?: number;
  action?: string;
  deadline?: string;
  updatedBy: string;
}

export interface ProjectSchedule {
  currentPhase: ProjectPhase;
  currentStatus: string;
  progress: number;
  deadline: string;
  history: ScheduleHistory[];
}

// Firestoreで使用するプロジェクトデータ型を拡張
export interface Project {
  id: string;
  name: string;
  // ...既存のプロジェクトフィールド
  schedule: ProjectSchedule;
}