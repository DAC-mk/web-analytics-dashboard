'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, getDocs } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useAuth } from '@/lib/authContext';

// プロジェクトの型定義
interface Project {
  id: string;
  name: string;
  description?: string;
  client?: string;
  schedule?: {
    currentPhase: string;
    currentStatus: string;
    progress: number;
    deadline?: string;
  };
}

export default function SchedulePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const router = useRouter();
  
  // ログイン状態をチェック
  useEffect(() => {
    if (!user && !loading) {
      router.push('/');
    }
  }, [user, loading, router]);
  
  // プロジェクト一覧取得
  useEffect(() => {
    const fetchProjects = async () => {
      if (user) {
        try {
          setLoading(true);
          const projectsCollection = collection(db, 'projects');
          const projectSnapshot = await getDocs(projectsCollection);
          
          if (projectSnapshot.empty) {
            setProjects([]);
            return;
          }
          
          const projectsList: Project[] = [];
          projectSnapshot.forEach(doc => {
            const data = doc.data();
            projectsList.push({
              id: doc.id,
              name: data.name,
              description: data.description,
              client: data.client,
              schedule: data.schedule
            });
          });
          
          setProjects(projectsList);
        } catch (error) {
          console.error('Error fetching projects:', error);
        } finally {
          setLoading(false);
        }
      }
    };
    
    fetchProjects();
  }, [user]);
  
  // フェーズに基づくステータスのバッジカラー
  const getPhaseColor = (phase: string): string => {
    const colors: Record<string, string> = {
      design: 'bg-purple-100 text-purple-800',
      coding: 'bg-blue-100 text-blue-800',
      testing: 'bg-yellow-100 text-yellow-800',
      preparation: 'bg-orange-100 text-orange-800',
      live: 'bg-green-100 text-green-800'
    };
    
    return colors[phase] || 'bg-gray-100 text-gray-800';
  };
  
  // 納期までの残り日数を計算
  const getDaysRemaining = (deadline?: string): number | null => {
    if (!deadline) return null;
    
    const today = new Date();
    const deadlineDate = new Date(deadline);
    
    today.setHours(0, 0, 0, 0);
    deadlineDate.setHours(0, 0, 0, 0);
    
    const differenceMs = deadlineDate.getTime() - today.getTime();
    return Math.ceil(differenceMs / (1000 * 60 * 60 * 24));
  };
  
  // 残り日数に基づく表示クラス
  const getDeadlineClass = (daysRemaining: number | null): string => {
    if (daysRemaining === null) return 'text-gray-500';
    if (daysRemaining < 0) return 'text-red-500';
    if (daysRemaining <= 7) return 'text-orange-500';
    return 'text-green-500';
  };
  
  // フェーズの日本語表示
  const getPhaseLabel = (phase: string): string => {
    const labels: Record<string, string> = {
      design: 'デザイン',
      coding: 'コーディング',
      testing: 'テスト・調整',
      preparation: '公開準備',
      live: '公開済み'
    };
    
    return labels[phase] || phase;
  };
  
  if (loading) {
    return <div className="p-8 text-center">読み込み中...</div>;
  }
  
  if (!user) {
    return null; // ログインページにリダイレクト中
  }
  
  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">スケジュール管理</h1>
          <div className="flex space-x-2">
            <button 
              onClick={() => router.push('/dashboard')}
              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
            >
              ダッシュボード
            </button>
            <button 
              onClick={() => auth.signOut()}
              className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"
            >
              ログアウト
            </button>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {projects.length === 0 ? (
            <div className="bg-white shadow rounded-lg p-6 text-center">
              <p className="text-gray-500">プロジェクトがありません。</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map(project => {
                const daysRemaining = getDaysRemaining(project.schedule?.deadline);
                const deadlineClass = getDeadlineClass(daysRemaining);
                
                return (
                  <div 
                    key={project.id} 
                    className="bg-white shadow rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition-shadow duration-300"
                    onClick={() => router.push(`/schedule/${project.id}`)}
                  >
                    <div className="p-5">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{project.name}</h3>
                      {project.client && (
                        <p className="text-sm text-gray-600 mb-3">
                          クライアント: {project.client}
                        </p>
                      )}
                      
                      {project.schedule ? (
                        <>
                          <div className="flex items-center justify-between mb-3">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPhaseColor(project.schedule.currentPhase)}`}>
                              {getPhaseLabel(project.schedule.currentPhase)}
                            </span>
                            <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-blue-500 rounded-full" 
                                style={{ width: `${project.schedule.progress || 0}%` }}
                              ></div>
                            </div>
                          </div>
                          
                          <p className="text-sm text-gray-700 mb-3">
                            ステータス: {project.schedule.currentStatus}
                          </p>
                          
                          {project.schedule.deadline && (
                            <div className="flex justify-between items-center">
                              <p className="text-sm text-gray-700">
                                納期: {new Date(project.schedule.deadline).toLocaleDateString()}
                              </p>
                              <p className={`text-sm font-medium ${deadlineClass}`}>
                                {daysRemaining !== null
                                  ? daysRemaining < 0
                                    ? `${Math.abs(daysRemaining)}日超過`
                                    : `あと${daysRemaining}日`
                                  : ''}
                              </p>
                            </div>
                          )}
                        </>
                      ) : (
                        <p className="text-sm text-gray-500 italic">
                          スケジュール未設定
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}