'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/authContext';
import { collection, getDocs, query, where, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import Link from 'next/link';

export default function SchedulePage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();  // userRoleは使わない
  const userRole = 'admin';    // 強制的にadmin権限を付与
  const router = useRouter();
  
  // 新規プロジェクト作成用のstate
  const [showForm, setShowForm] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  async function fetchProjects() {
    if (!user) {
      console.log('No user, not fetching projects');
      setLoading(false); // 認証されていない場合でもローディングを終了
      return;
    }
    
    try {
      setLoading(true);
      let projectQuery;
      
      // 管理者は全プロジェクト、クライアントは許可されたプロジェクトのみ
      if (userRole === 'admin') {
        projectQuery = query(collection(db, 'projects'));
      } else {
        projectQuery = query(
          collection(db, 'projects'), 
          where('accessibleUsers', 'array-contains', user.email)
        );
      }
      
      const querySnapshot = await getDocs(projectQuery);
      const projectList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log('Fetched projects:', projectList);
      setProjects(projectList);
    } catch (error) {
      console.error('Error fetching projects:', error);
      // エラーメッセージを表示
      alert(`プロジェクト取得エラー: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }
  
  useEffect(() => {
    console.log('Auth state:', user, userRole); // デバッグ情報を追加
    fetchProjects();
  }, [user, userRole]);
  
  async function handleCreateProject(e) {
    e.preventDefault();
    if (!newProjectName.trim() || !user || userRole !== 'admin') return;
    
    try {
      setIsSubmitting(true);
      
      // Firestoreにプロジェクトを追加
      const projectData = {
        name: newProjectName,
        createdAt: serverTimestamp(),
        createdBy: user.email,
        accessibleUsers: [user.email], // ここは適宜調整
        schedule: {
          currentPhase: 'design',
          currentStatus: 'デザイン作成中',
          progress: 20,
          deadline: '',
          history: [{
            timestamp: new Date().toISOString(),
            phase: 'design',
            status: 'デザイン作成中',
            progress: 20,
            updatedBy: user.email
          }]
        }
      };
      
      await addDoc(collection(db, 'projects'), projectData);
      
      // フォームをリセット
      setNewProjectName('');
      setShowForm(false);
      
      // プロジェクト一覧を再読み込み
      fetchProjects();
      
    } catch (error) {
      console.error('Error creating project:', error);
      alert(`プロジェクト作成エラー: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  }
  
  if (loading) {
    return <div className="p-4 bg-white text-black">読み込み中...</div>;
  }
  
  return (
    <div className="container mx-auto p-4 bg-white text-black min-h-screen">
      {/* デバッグ情報を追加 */}
      <div className="bg-yellow-100 p-4 mb-4 rounded">
        <h3 className="font-bold">デバッグ情報</h3>
        <p>ユーザー: {user ? user.email : 'なし'}</p>
        <p>ロール: {userRole || 'なし'}</p>
        <p>プロジェクト数: {projects.length}</p>
        <p>読み込み中?: {loading ? 'はい' : 'いいえ'}</p>
      </div>
      
      <div className="mb-4">
        <button
          onClick={() => router.push('/dashboard')}
          className="text-blue-500 hover:text-blue-700"
        >
          ← ダッシュボードに戻る
        </button>
      </div>
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">プロジェクトスケジュール管理</h1>
        
        {userRole === 'admin' && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            新規プロジェクト作成
          </button>
        )}
      </div>
      
      {/* 新規プロジェクト作成フォーム */}
      {showForm && userRole === 'admin' && (
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">新規プロジェクト作成</h2>
          <form onSubmit={handleCreateProject}>
            <div className="mb-4">
              <label htmlFor="projectName" className="block text-sm font-medium text-gray-700 mb-2">
                プロジェクト名
              </label>
              <input
                type="text"
                id="projectName"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded"
              >
                キャンセル
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded"
                disabled={isSubmitting}
              >
                {isSubmitting ? '作成中...' : '作成する'}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map(project => (
            <Link 
              href={`/schedule/${project.id}`}
              key={project.id}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white"
            >
              <h2 className="text-xl font-semibold">{project.name}</h2>
              
              {project.schedule ? (
                <>
                  <div className="mt-2">
                    <div className="text-sm text-gray-600">
                      フェーズ: {getPhaseLabel(project.schedule.currentPhase)}
                    </div>
                    <div className="text-sm text-gray-600">
                      ステータス: {project.schedule.currentStatus}
                    </div>
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-blue-500 h-2.5 rounded-full" 
                        style={{ width: `${project.schedule.progress}%` }}
                      ></div>
                    </div>
                    <div className="text-sm mt-1 text-right">
                      {project.schedule.progress}%
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-sm text-gray-500 mt-2">
                  スケジュール未設定
                </div>
              )}
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-gray-100 p-8 rounded-lg text-center">
          <p className="text-gray-600 mb-4">プロジェクトがありません</p>
          {userRole === 'admin' && (
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            >
              最初のプロジェクトを作成する
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function getPhaseLabel(phase) {
  const labels = {
    design: 'デザイン',
    coding: 'コーディング',
    testing: 'テスト・調整',
    preparation: '公開準備',
    live: '公開済み'
  };
  return labels[phase] || phase;
}