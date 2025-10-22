'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '../../../lib/authContext';
import { getProjectSchedule, updateProjectPhase, updateProjectDeadline } from '../../../lib/scheduleService';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import ProgressBar from '../../../components/schedule/ProgressBar';
import PhaseIndicator from '../../../components/schedule/PhaseIndicator';
import { ProjectPhase } from '../../../types/schedule';

export default function ProjectSchedulePage() {
  const { projectId } = useParams();
  const { user } = useAuth(); // userRoleは使わない
  const userRole = 'admin'; // 強制的に管理者権限を設定
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [deadline, setDeadline] = useState('');
  const isAdmin = true; // 強制的にtrue設定
  
  // ステータスオプション（フェーズごと）
  const statusOptions: Record<ProjectPhase, string[]> = {
    design: ['デザイン作成中', 'デザインレビュー中', 'デザイン修正中', 'デザイン完了'],
    coding: ['コーディング中', 'レスポンシブ対応中', 'コーディング修正中', 'コーディング完了'],
    testing: ['内部テスト中', 'クライアントレビュー中', '修正対応中', 'テスト完了'],
    preparation: ['サーバー設定中', 'ドメイン設定中', '最終確認中', '公開準備完了'],
    live: ['公開済み', 'メンテナンス中']
  };
  
  useEffect(() => {
    async function fetchProjectData() {
      if (!projectId) return;
      
      try {
        setLoading(true);
        
        // プロジェクト基本情報取得
        const projectRef = doc(db, 'projects', projectId as string);
        const projectSnap = await getDoc(projectRef);
        
        if (!projectSnap.exists()) {
          throw new Error('Project not found');
        }
        
        const projectData = {
          id: projectSnap.id,
          ...projectSnap.data()
        };
        
        // スケジュール情報取得
        const scheduleData = await getProjectSchedule(projectId as string);
        
        // スケジュールデータがなければ初期値を設定
        if (!scheduleData && isAdmin) {
          const initialSchedule = {
            currentPhase: 'design' as ProjectPhase,
            currentStatus: 'デザイン作成中',
            progress: 20,
            deadline: '',
            history: []
          };
          projectData.schedule = initialSchedule;
        } else if (scheduleData) {
          projectData.schedule = scheduleData;
        }
        
        setProject(projectData);
        
        // フォーム状態初期化
        if (projectData.schedule) {
          setSelectedStatus(projectData.schedule.currentStatus);
          setDeadline(projectData.schedule.deadline || '');
        }
      } catch (error) {
        console.error('Error fetching project:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchProjectData();
  }, [projectId, isAdmin]);
  
  const handlePhaseChange = async (phase: ProjectPhase) => {
    if (!isAdmin || !project || !user) return;
    
    // デフォルトステータスを選択
    const newStatus = statusOptions[phase][0];
    setSelectedStatus(newStatus);
    
    try {
      await updateProjectPhase(projectId as string, phase, newStatus, user.email || 'unknown');
      
      // 画面表示を更新
      setProject(prev => ({
        ...prev,
        schedule: {
          ...prev.schedule,
          currentPhase: phase,
          currentStatus: newStatus,
          progress: getProgressForPhase(phase)
        }
      }));
    } catch (error) {
      console.error('Failed to update phase:', error);
    }
  };
  
  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!isAdmin || !project || !user) return;
    
    const newStatus = e.target.value;
    setSelectedStatus(newStatus);
    
    try {
      await updateProjectPhase(
        projectId as string, 
        project.schedule.currentPhase, 
        newStatus, 
        user.email || 'unknown'
      );
      
      // 画面表示を更新
      setProject(prev => ({
        ...prev,
        schedule: {
          ...prev.schedule,
          currentStatus: newStatus
        }
      }));
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };
  
  const handleDeadlineChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isAdmin || !project || !user) return;
    
    const newDeadline = e.target.value;
    setDeadline(newDeadline);
    
    try {
      await updateProjectDeadline(projectId as string, newDeadline, user.email || 'unknown');
      
      // 画面表示を更新
      setProject(prev => ({
        ...prev,
        schedule: {
          ...prev.schedule,
          deadline: newDeadline
        }
      }));
    } catch (error) {
      console.error('Failed to update deadline:', error);
    }
  };
  
  // フェーズに基づく進捗率を計算
  function getProgressForPhase(phase: ProjectPhase): number {
    const progressMap: Record<ProjectPhase, number> = {
      design: 20,
      coding: 40,
      testing: 60,
      preparation: 80,
      live: 100
    };
    return progressMap[phase] || 0;
  }
  
  if (loading) {
    return <div className="p-4 bg-white text-black">読み込み中...</div>;
  }
  
  if (!project) {
    return <div className="p-4 bg-white text-black">プロジェクトが見つかりません</div>;
  }
  
  if (!project.schedule) {
    return (
      <div className="p-4 bg-white text-black">
        <h1 className="text-2xl font-bold mb-4 text-black">{project.name}</h1>
        <p>スケジュール情報が設定されていません。</p>
        {isAdmin && (
          <button
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
            onClick={() => handlePhaseChange('design')}
          >
            スケジュール設定を開始
          </button>
        )}
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-4 bg-white text-black min-h-screen">
      <h1 className="text-2xl font-bold mb-4 text-black">{project.name}</h1>
      
      <div className="bg-white shadow-md rounded-lg p-6 mb-6 text-black">
        <h2 className="text-xl font-semibold mb-4 text-black">進捗状況</h2>
        
        {/* 進捗バー */}
        <ProgressBar progress={project.schedule.progress} />
        
        {/* フェーズインジケーター */}
        <div className="my-6">
          <PhaseIndicator 
            currentPhase={project.schedule.currentPhase}
            onPhaseChange={handlePhaseChange}
            isAdmin={isAdmin}
          />
        </div>
        
        {/* ステータスと納期 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div>
            <label className="block text-sm font-medium text-black mb-2">
              現在のステータス
            </label>
            {isAdmin ? (
              <select
                value={selectedStatus}
                onChange={handleStatusChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-black"
              >
                {statusOptions[project.schedule.currentPhase].map(option => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            ) : (
              <div className="p-2 bg-gray-100 rounded text-black">
                {project.schedule.currentStatus}
              </div>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-black mb-2">
              予定納期
            </label>
            {isAdmin ? (
              <input
                type="date"
                value={deadline}
                onChange={handleDeadlineChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-black"
              />
            ) : (
              <div className="p-2 bg-gray-100 rounded text-black">
                {project.schedule.deadline ? 
                  new Date(project.schedule.deadline).toLocaleDateString() : 
                  '未設定'}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* 履歴表示セクション */}
      {project.schedule.history && project.schedule.history.length > 0 && (
        <div className="bg-white shadow-md rounded-lg p-6 text-black">
          <h2 className="text-xl font-semibold mb-4 text-black">更新履歴</h2>
          <div className="space-y-4">
            {[...project.schedule.history]
              .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
              .slice(0, 5) // 最新の5件のみを表示
              .map((item, index) => (
                <div key={index} className="border-b pb-2">
                  <div className="text-sm text-gray-500">
                    {new Date(item.timestamp).toLocaleString()}
                  </div>
                  {item.action === 'deadline_updated' ? (
                    <div className="text-black">
                      納期が <strong>{new Date(item.deadline).toLocaleDateString()}</strong> に更新されました
                    </div>
                  ) : (
                    <div className="text-black">
                      フェーズが <strong>{getPhaseLabel(item.phase)}</strong>、
                      ステータスが <strong>{item.status}</strong> に更新されました
                    </div>
                  )}
                  <div className="text-xs text-gray-400 mt-1">
                    更新者: {item.updatedBy}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

function getPhaseLabel(phase: string): string {
  const labels: Record<string, string> = {
    design: 'デザイン',
    coding: 'コーディング',
    testing: 'テスト・調整',
    preparation: '公開準備',
    live: '公開済み'
  };
  return labels[phase] || phase;
}