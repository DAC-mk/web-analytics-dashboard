import { db } from './firebase';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { ProjectSchedule, ProjectPhase } from '../types/schedule';

// プロジェクトのスケジュール情報を取得
export async function getProjectSchedule(projectId: string): Promise<ProjectSchedule | null> {
  try {
    const projectRef = doc(db, 'projects', projectId);
    const projectSnap = await getDoc(projectRef);
    
    if (projectSnap.exists()) {
      const data = projectSnap.data();
      return data.schedule || null;
    }
    return null;
  } catch (error) {
    console.error('Error getting project schedule:', error);
    throw error;
  }
}

// フェーズとステータスを更新
export async function updateProjectPhase(
  projectId: string, 
  phase: ProjectPhase, 
  status: string,
  userId: string
): Promise<void> {
  try {
    const projectRef = doc(db, 'projects', projectId);
    const projectSnap = await getDoc(projectRef);
    
    if (!projectSnap.exists()) {
      throw new Error('Project not found');
    }
    
    // 進捗率の自動計算（フェーズに基づく）
    const progressMap: Record<ProjectPhase, number> = {
      design: 20,
      coding: 40,
      testing: 60,
      preparation: 80,
      live: 100
    };
    
    const progress = progressMap[phase];
    const timestamp = new Date().toISOString();
    
    // スケジュール更新と履歴追加
    await updateDoc(projectRef, {
      'schedule.currentPhase': phase,
      'schedule.currentStatus': status,
      'schedule.progress': progress,
      'schedule.history': arrayUnion({
        timestamp,
        phase,
        status,
        progress,
        updatedBy: userId
      })
    });
  } catch (error) {
    console.error('Error updating project phase:', error);
    throw error;
  }
}

// 納期の更新
export async function updateProjectDeadline(
  projectId: string, 
  deadline: string,
  userId: string
): Promise<void> {
  try {
    const projectRef = doc(db, 'projects', projectId);
    await updateDoc(projectRef, {
      'schedule.deadline': deadline
    });
    
    // 履歴に記録
    const timestamp = new Date().toISOString();
    await updateDoc(projectRef, {
      'schedule.history': arrayUnion({
        timestamp,
        action: 'deadline_updated',
        deadline,
        updatedBy: userId
      })
    });
  } catch (error) {
    console.error('Error updating project deadline:', error);
    throw error;
  }
}