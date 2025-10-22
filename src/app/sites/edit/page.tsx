'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/authContext';
import { useRouter } from 'next/navigation';
import { collection, doc, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function EditSites() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [sites, setSites] = useState<any[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    // 認証されていない場合はログインページにリダイレクト
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const fetchSites = async () => {
      if (user) {
        try {
          const sitesSnapshot = await getDocs(collection(db, 'sites'));
          const sitesList = sitesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setSites(sitesList);
        } catch (error) {
          console.error('Error fetching sites:', error);
        }
      }
    };

    fetchSites();
  }, [user]);

  const handlePropertyIdChange = (siteId: string, propertyId: string) => {
    setSites(sites.map(site => 
      site.id === siteId ? { ...site, propertyId } : site
    ));
  };

  const updateSite = async (siteId: string) => {
    setIsUpdating(true);
    try {
      const site = sites.find(s => s.id === siteId);
      await updateDoc(doc(db, 'sites', siteId), {
        propertyId: site.propertyId || ''
      });
      alert('更新完了');
    } catch (error) {
      console.error('Error updating site:', error);
      alert('更新失敗: ' + error);
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">読み込み中...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">サイト編集</h1>
          <button 
            onClick={() => router.push('/dashboard')} 
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            ダッシュボードに戻る
          </button>
        </div>
      </header>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h2 className="text-xl font-semibold mb-4">Google AnalyticsのプロパティIDを設定</h2>
          {sites.length > 0 ? (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {sites.map((site) => (
                  <li key={site.id} className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-medium">{site.name}</h3>
                        <p className="text-sm text-gray-500">{site.url}</p>
                      </div>
                      <div className="ml-4 flex items-center space-x-2">
                        <input 
                          type="text" 
                          className="border rounded px-2 py-1 w-40"
                          placeholder="プロパティID"
                          value={site.propertyId || ''}
                          onChange={(e) => handlePropertyIdChange(site.id, e.target.value)}
                        />
                        <button 
                          onClick={() => updateSite(site.id)}
                          disabled={isUpdating}
                          className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 disabled:opacity-50"
                        >
                          更新
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p>サイトがありません。</p>
          )}
        </div>
      </main>
    </div>
  );
}