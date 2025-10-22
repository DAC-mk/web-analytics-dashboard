'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/authContext';
import { useRouter } from 'next/navigation';
import { collection, getDocs } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import DateRangeSelector from '@/components/DateRangeSelector';
import { DateRangeParams } from '@/lib/analytics';
// Rechartsのインポート
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Sector
} from 'recharts';

// 型定義
interface AnalyticsData {
  overview: {
    rows: Array<{
      dimensionValues: Array<{value: string}>;
      metricValues: Array<{value: string}>;
    }>;
  } | null;
  topPages: {
    rows: Array<{
      dimensionValues: Array<{value: string}>;
      metricValues: Array<{value: string}>;
    }>;
  } | null;
  deviceData: {
    rows: Array<{
      dimensionValues: Array<{value: string}>;
      metricValues: Array<{value: string}>;
    }>;
  } | null;
  referrerData: {
    rows: Array<{
      dimensionValues: Array<{value: string}>;
      metricValues: Array<{value: string}>;
    }>;
  } | null;
  clickEvents: {
    rows: Array<{
      dimensionValues: Array<{value: string}>;
      metricValues: Array<{value: string}>;
    }>;
  } | null;
  searchTerms: {
    rows: Array<{
      dimensionValues: Array<{value: string}>;
      metricValues: Array<{value: string}>;
    }>;
  } | null;
}

interface Site {
  id: string;
  name: string;
  url: string;
  propertyId: string;
  description?: string;
}

// グラフの色設定
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A259FF', '#FB6D3A'];

export default function Dashboard() {
  const [sites, setSites] = useState<Site[]>([]);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [dateRange, setDateRange] = useState<DateRangeParams>({ type: 'week' });
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'ascending' | 'descending';
    table: string;
  } | null>(null);
  // 表示モード（テーブル/グラフ）の状態
  const [viewModes, setViewModes] = useState({
    deviceData: 'table',
    referrerData: 'table',
  });
  // 「もっと見る」の状態管理
  const [showMoreOverview, setShowMoreOverview] = useState(false);
  const [showMoreTopPages, setShowMoreTopPages] = useState(false);
  
  // 円グラフのアクティブセクションの状態 - コンポーネントのトップレベルで宣言
  const [deviceActiveIndex, setDeviceActiveIndex] = useState(0);

  const { user, loading } = useAuth();
  const router = useRouter();

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
          })) as Site[];
          setSites(sitesList);
          
          // 初期選択サイトの設定
          if (sitesList.length > 0 && !selectedSite) {
            setSelectedSite(sitesList[0]);
          }
        } catch (error) {
          console.error('Error fetching sites:', error);
        }
      }
    };

    fetchSites();
  }, [user, selectedSite]);

  // サイトが選択された時またはdateRangeが変更された時にデータを取得
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      if (selectedSite?.propertyId) {
        try {
          setIsLoading(true);
          
          // POSTエンドポイントを使用して全データを一度に取得
          const response = await fetch('/api/analytics', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              propertyId: selectedSite.propertyId,
              dateRange,
            }),
          });
          
          if (!response.ok) {
            throw new Error('Failed to fetch analytics data');
          }
          
          const result = await response.json();
          setAnalyticsData(result.data);
        } catch (error) {
          console.error('Error fetching analytics data:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    if (selectedSite) {
      fetchAnalyticsData();
    }
  }, [selectedSite, dateRange]);

  // 表示モードの切り替え関数
  const toggleViewMode = (section: keyof typeof viewModes) => {
    setViewModes({
      ...viewModes,
      [section]: viewModes[section] === 'table' ? 'chart' : 'table'
    });
  };

  // ソート関数
  const sortData = (data: Array<{dimensionValues: Array<{value: string}>; metricValues: Array<{value: string}>}>, key: string, direction: 'ascending' | 'descending') => {
    return [...data].sort((a, b) => {
      // 値の取得方法を決定（dimensionValues または metricValues）
      let aValue: string | number;
      let bValue: string | number;

      // キーに基づいて適切な値を取得
      if (key === 'date') {
        aValue = a.dimensionValues[0].value;
        bValue = b.dimensionValues[0].value;
      } else if (key === 'pagePath') {
        aValue = a.dimensionValues[0].value;
        bValue = b.dimensionValues[0].value;
      } else if (key === 'pageTitle') {
        aValue = a.dimensionValues[1].value;
        bValue = b.dimensionValues[1].value;
      } else if (key === 'device') {
        aValue = a.dimensionValues[0].value;
        bValue = b.dimensionValues[0].value;
      } else if (key === 'referrer') {
        aValue = a.dimensionValues[0].value;
        bValue = b.dimensionValues[0].value;
      } else if (key === 'pageViews') {
        aValue = parseInt(a.metricValues[0].value);
        bValue = parseInt(b.metricValues[0].value);
      } else if (key === 'users') {
        aValue = parseInt(a.metricValues[1] ? a.metricValues[1].value : a.metricValues[0].value);
        bValue = parseInt(b.metricValues[1] ? b.metricValues[1].value : b.metricValues[0].value);
      } else if (key === 'avgDuration') {
        aValue = parseFloat(a.metricValues[1].value);
        bValue = parseFloat(b.metricValues[1].value);
      } else if (key === 'sessions') {
        aValue = parseInt(a.metricValues[0].value);
        bValue = parseInt(b.metricValues[0].value);
      } else {
        // デフォルト
        aValue = '';
        bValue = '';
      }

      // ソート方向に応じて比較
      if (aValue < bValue) {
        return direction === 'ascending' ? -1 : 1;
      }
      if (aValue > bValue) {
        return direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });
  };

  // ソートリクエスト処理関数
  const requestSort = (key: string, table: string) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    
    // 同じキーで既にソートされている場合は方向を反転
    if (sortConfig && sortConfig.key === key && sortConfig.table === table) {
      direction = sortConfig.direction === 'ascending' ? 'descending' : 'ascending';
    }
    
    setSortConfig({ key, direction, table });
  };

  const handleSiteSelect = (site: Site) => {
    setSelectedSite(site);
  };

  const handleDateRangeChange = (type: 'day' | 'week' | 'month' | 'custom', startDate?: string, endDate?: string) => {
    if (type === 'custom' && startDate && endDate) {
      setDateRange({ type, startDate, endDate });
    } else {
      setDateRange({ type });
    }
  };
  
  // 日付範囲ボタンのレンダリング
  const renderDateRangeButtons = () => {
    return (
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={() => handleDateRangeChange('day')}
          className={`px-4 py-2 rounded text-sm ${
            dateRange.type === 'day'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          日次
        </button>
        <button
          onClick={() => handleDateRangeChange('week')}
          className={`px-4 py-2 rounded text-sm ${
            dateRange.type === 'week'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          週次
        </button>
        <button
          onClick={() => handleDateRangeChange('month')}
          className={`px-4 py-2 rounded text-sm ${
            dateRange.type === 'month'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          月次
        </button>
        <button
          onClick={() => setDateRange({ type: 'custom', startDate: '', endDate: '' })}
          className={`px-4 py-2 rounded text-sm ${
            dateRange.type === 'custom'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          カスタム
        </button>
        
        {dateRange.type === 'custom' && (
          <div className="flex flex-wrap gap-2 items-center mt-2 w-full">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">開始日:</label>
              <input
                type="date"
                value={dateRange.startDate || ''}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                className="border rounded px-2 py-1 text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">終了日:</label>
              <input
                type="date"
                value={dateRange.endDate || ''}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                className="border rounded px-2 py-1 text-sm"
              />
            </div>
            <button
              onClick={() => {
                if (dateRange.startDate && dateRange.endDate) {
                  handleDateRangeChange('custom', dateRange.startDate, dateRange.endDate);
                }
              }}
              disabled={!dateRange.startDate || !dateRange.endDate}
              className="px-4 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:opacity-50 disabled:hover:bg-blue-500"
            >
              適用
            </button>
          </div>
        )}
      </div>
    );
  };
  
  // アクティブな円グラフのセクション用のカスタムコンポーネント
  const renderActiveShape = (props: {
    cx: number;
    cy: number;
    midAngle: number;
    innerRadius: number;
    outerRadius: number;
    startAngle: number;
    endAngle: number;
    fill: string;
    payload: {name: string};
    percent: number;
    value: number;
  }) => {
    const RADIAN = Math.PI / 180;
    const { 
      cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle,
      fill, payload, percent, value 
    } = props;
    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);
    const sx = cx + (outerRadius + 10) * cos;
    const sy = cy + (outerRadius + 10) * sin;
    const mx = cx + (outerRadius + 30) * cos;
    const my = cy + (outerRadius + 30) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 22;
    const ey = my;
    const textAnchor = cos >= 0 ? 'start' : 'end';
  
    return (
      <g>
        <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill}>
          {payload.name}
        </text>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 6}
          outerRadius={outerRadius + 10}
          fill={fill}
        />
        <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
        <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
        <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#333">
          {`${payload.name}: ${value}`}
        </text>
        <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="#999">
          {`(${(percent * 100).toFixed(2)}%)`}
        </text>
      </g>
    );
  };

  // アナリティクスデータのオーバービューをレンダリング
  const renderOverviewData = () => {
    if (!analyticsData?.overview || !analyticsData.overview.rows) return null;
    
    // データをソート
    let sortedData = [...analyticsData.overview.rows];
    if (sortConfig && sortConfig.table === 'overview') {
      sortedData = sortData(sortedData, sortConfig.key, sortConfig.direction);
    }
    
    // グラフ用データの整形
    const chartData = sortedData.map(row => {
      // 日付のフォーマットを整形（YYYYMMDD → YYYY-MM-DD）
      const rawDate = row.dimensionValues[0].value;
      const formattedDate = `${rawDate.substring(0, 4)}-${rawDate.substring(4, 6)}-${rawDate.substring(6, 8)}`;
      
      return {
        date: formattedDate,
        pageViews: parseInt(row.metricValues[0].value),
        users: parseInt(row.metricValues[1].value)
      };
    });
    
    // 表示するデータ（上位10件またはすべて）
    const displayData = showMoreOverview ? sortedData : sortedData.slice(0, 10);
    
    // ソート方向に応じたアイコンを表示する関数
    const getSortIcon = (key: string) => {
      if (sortConfig && sortConfig.table === 'overview' && sortConfig.key === key) {
        return sortConfig.direction === 'ascending' ? ' ↑' : ' ↓';
      }
      return ' ⇅'; // デフォルトでソートアイコンを表示
    };
    
    return (
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h3 className="text-lg font-semibold mb-4">アクセス概要</h3>
        
        {/* グラフ表示 - 常に表示 */}
        <div className="h-64 mb-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 30 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => value.substring(5)} // 月-日だけ表示
                interval={1} // 1つおきに表示
                angle={-30} // 角度をつける
                textAnchor="end"
                height={60} // 高さを確保
              />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => {
                  if (name === 'pageViews') return [value, '表示回数'];
                  if (name === 'users') return [value, 'ユーザー数'];
                  return [value, name];
                }}
                labelFormatter={(label) => `日付: ${label}`}
              />
              <Legend 
                formatter={(value) => {
                  if (value === 'pageViews') return '表示回数';
                  if (value === 'users') return 'ユーザー数';
                  return value;
                }}
              />
              <Line 
                type="monotone" 
                dataKey="pageViews" 
                stroke="#8884d8" 
                activeDot={{ r: 8 }}
                name="表示回数"
              />
              <Line 
                type="monotone" 
                dataKey="users" 
                stroke="#82ca9d"
                name="ユーザー数"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        {/* テーブル表示 */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => requestSort('date', 'overview')}
                >
                  日付{getSortIcon('date')}
                </th>
                <th 
                  className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => requestSort('pageViews', 'overview')}
                >
                  表示回数{getSortIcon('pageViews')}
                </th>
                <th 
                  className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => requestSort('users', 'overview')}
                >
                  ユーザー数{getSortIcon('users')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {displayData.map((row, index) => {
                // 日付のフォーマットを整形（YYYYMMDD → YYYY-MM-DD）
                const rawDate = row.dimensionValues[0].value;
                const formattedDate = `${rawDate.substring(0, 4)}-${rawDate.substring(4, 6)}-${rawDate.substring(6, 8)}`;
                
                return (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{formattedDate}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{row.metricValues[0].value}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{row.metricValues[1].value}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {/* もっと見るボタン - 10件以上ある場合のみ表示 */}
          {sortedData.length > 10 && (
            <div className="text-center mt-4">
              <button 
                onClick={() => setShowMoreOverview(!showMoreOverview)} 
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                {showMoreOverview ? '表示を少なくする' : 'もっと見る'}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // デバイスデータをレンダリング
  const renderDeviceData = () => {
    if (!analyticsData?.deviceData || !analyticsData.deviceData.rows) return null;
    
    // データをソート
    let sortedData = [...analyticsData.deviceData.rows];
    if (sortConfig && sortConfig.table === 'deviceData') {
      sortedData = sortData(sortedData, sortConfig.key, sortConfig.direction);
    }
    
    // グラフ用データの整形
    const chartData = sortedData.map((row) => ({
      name: row.dimensionValues[0].value,
      value: parseInt(row.metricValues[0].value)
    }));
    
    // ソート方向に応じたアイコンを表示する関数
    const getSortIcon = (key: string) => {
      if (sortConfig && sortConfig.table === 'deviceData' && sortConfig.key === key) {
        return sortConfig.direction === 'ascending' ? ' ↑' : ' ↓';
      }
      return ' ⇅'; // デフォルトでソートアイコンを表示
    };
    
    // 円グラフのアクティブセクション更新関数
    const onPieEnter = (_: unknown, index: number) => {
      setDeviceActiveIndex(index);
    };
    
    return (
      <div className="bg-white p-4 rounded-lg shadow h-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">デバイス別アクセス</h3>
          <button 
            onClick={() => toggleViewMode('deviceData')} 
            className="px-3 py-1 bg-gray-100 rounded text-sm hover:bg-gray-200"
          >
            {viewModes.deviceData === 'table' ? 'グラフ表示' : 'テーブル表示'}
          </button>
        </div>
        
        {viewModes.deviceData === 'table' ? (
          // テーブル表示
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => requestSort('device', 'deviceData')}
                  >
                    デバイス{getSortIcon('device')}
                  </th>
                  <th 
                    className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => requestSort('users', 'deviceData')}
                  >
                    ユーザー数{getSortIcon('users')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedData.map((row, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{row.dimensionValues[0].value}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{row.metricValues[0].value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          // グラフ表示
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  activeIndex={deviceActiveIndex}
                  activeShape={renderActiveShape}
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  onMouseEnter={onPieEnter}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend 
                  formatter={(_value, _entry, index) => chartData[index % chartData.length].name}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    );
  };

  // 参照元データをレンダリング
  const renderReferrerData = () => {
    if (!analyticsData?.referrerData || !analyticsData.referrerData.rows) return null;
    
    // データをソート
    let sortedData = [...analyticsData.referrerData.rows];
    if (sortConfig && sortConfig.table === 'referrerData') {
      sortedData = sortData(sortedData, sortConfig.key, sortConfig.direction);
    }
    
    // グラフ用データの整形
    const chartData = sortedData.map((row) => ({
      name: row.dimensionValues[0].value === '(direct)' ? '直接アクセス' : row.dimensionValues[0].value,
      sessions: parseInt(row.metricValues[0].value)
    }));
    
    // ソート方向に応じたアイコンを表示する関数
    const getSortIcon = (key: string) => {
      if (sortConfig && sortConfig.table === 'referrerData' && sortConfig.key === key) {
        return sortConfig.direction === 'ascending' ? ' ↑' : ' ↓';
      }
      return ' ⇅'; // デフォルトでソートアイコンを表示
    };
    
    return (
      <div className="bg-white p-4 rounded-lg shadow h-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">アクセス参照元</h3>
          <button 
            onClick={() => toggleViewMode('referrerData')} 
            className="px-3 py-1 bg-gray-100 rounded text-sm hover:bg-gray-200"
          >
            {viewModes.referrerData === 'table' ? 'グラフ表示' : 'テーブル表示'}
          </button>
        </div>
        
        {viewModes.referrerData === 'table' ? (
          // テーブル表示
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => requestSort('referrer', 'referrerData')}
                  >
                    参照元{getSortIcon('referrer')}
                  </th>
                  <th 
                    className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => requestSort('sessions', 'referrerData')}
                  >
                    セッション数{getSortIcon('sessions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedData.map((row, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                      {row.dimensionValues[0].value === '(direct)' ? '直接アクセス' : row.dimensionValues[0].value}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{row.metricValues[0].value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          // グラフ表示
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name"
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={70}
                  interval={0} // すべてのラベルを表示
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar 
                  dataKey="sessions" 
                  name="セッション数" 
                  fill="#8884d8" 
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    );
  };

  // トップページデータをレンダリング
  const renderTopPagesData = () => {
    if (!analyticsData?.topPages || !analyticsData.topPages.rows) return null;
    
    // データをソート
    let sortedData = [...analyticsData.topPages.rows];
    if (sortConfig && sortConfig.table === 'topPages') {
      sortedData = sortData(sortedData, sortConfig.key, sortConfig.direction);
    }
    
    // グラフ用データの整形 - パスを表示
    const chartData = sortedData.slice(0, 10).map((row) => {
      // パスが長い場合は省略
      const path = row.dimensionValues[0].value;
      const shortPath = path.length > 30 ? path.substring(0, 27) + '...' : path;
      
      return {
        name: shortPath,
        views: parseInt(row.metricValues[0].value),
        avgDuration: parseFloat(row.metricValues[1].value),
        fullPath: path
      };
    });
    
    // 表示するデータ（上位10件またはすべて）
    const displayData = showMoreTopPages ? sortedData : sortedData.slice(0, 10);
    
    // ソート方向に応じたアイコンを表示する関数
    const getSortIcon = (key: string) => {
      if (sortConfig && sortConfig.table === 'topPages' && sortConfig.key === key) {
        return sortConfig.direction === 'ascending' ? ' ↑' : ' ↓';
      }
      return ' ⇅'; // デフォルトでソートアイコンを表示
    };
    
    return (
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h3 className="text-lg font-semibold mb-4">人気ページ</h3>
        
        {/* グラフ表示 - 常に表示 */}
        <div className="h-64 mb-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              barGap={10} // 棒の間隔を10%広げる
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis 
                type="category" 
                dataKey="name" 
                width={200} // 幅を広くする
                tick={{ fontSize: 12 }}
                interval={0} // すべてのラベルを表示
              />
              <Tooltip 
                formatter={(value, name) => {
                  if (name === 'views') return [value, '閲覧数'];
                  return [value, name];
                }}
                labelFormatter={(label, payload) => {
                  if (payload && payload.length > 0) {
                    return payload[0].payload.fullPath;
                  }
                  return label;
                }}
              />
              <Legend 
                formatter={(value) => {
                  if (value === 'views') return '閲覧数';
                  return value;
                }}
              />
              <Bar 
                dataKey="views" 
                name="閲覧数" 
                fill="#8884d8" 
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* テーブル表示 */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => requestSort('pagePath', 'topPages')}
                >
                  ページ{getSortIcon('pagePath')}
                </th>
                <th 
                  className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => requestSort('pageTitle', 'topPages')}
                >
                  タイトル{getSortIcon('pageTitle')}
                </th>
                <th 
                  className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => requestSort('pageViews', 'topPages')}
                >
                  閲覧数{getSortIcon('pageViews')}
                </th>
                <th 
                  className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => requestSort('avgDuration', 'topPages')}
                >
                  平均滞在時間{getSortIcon('avgDuration')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {displayData.map((row, rowIndex) => (
                <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{row.dimensionValues[0].value}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{row.dimensionValues[1].value}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{row.metricValues[0].value}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{
                    // 秒を「分:秒」形式に変換
                    (() => {
                      const seconds = parseFloat(row.metricValues[1].value);
                      const minutes = Math.floor(seconds / 60);
                      const remainingSeconds = Math.floor(seconds % 60);
                      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
                    })()
                  }</td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {/* もっと見るボタン - 10件以上ある場合のみ表示 */}
          {sortedData.length > 10 && (
            <div className="text-center mt-4">
              <button 
                onClick={() => setShowMoreTopPages(!showMoreTopPages)} 
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                {showMoreTopPages ? '表示を少なくする' : 'もっと見る'}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">読み込み中...</div>;
  }

  if (!user) {
    return null; // useEffectでリダイレクトするため
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">WEB管理ダッシュボード</h1>
          <div className="flex space-x-4">
            <button 
              onClick={() => router.push('/schedule')} 
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              スケジュール管理
            </button>
            <button 
              onClick={() => router.push('/sites/edit')} 
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              サイト設定
            </button>
            <button 
              onClick={() => auth.signOut()} 
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              ログアウト
            </button>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* サイト選択プルダウン */}
          <div className="mb-6 flex items-center space-x-2">
            <label htmlFor="site-select" className="font-medium text-gray-700 whitespace-nowrap">サイト選択:</label>
            <select
              id="site-select"
              value={selectedSite?.id || ''}
              onChange={(e) => {
                const site = sites.find(s => s.id === e.target.value);
                if (site) {
                  handleSiteSelect(site);
                }
              }}
              className="border border-gray-300 rounded-md py-2 pl-3 pr-10 text-base focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              {sites.length > 0 ? (
                sites.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.name}
                  </option>
                ))
              ) : (
                <option value="" disabled>サイトがありません</option>
              )}
            </select>
          </div>
          
          {/* サイトがない場合の通知 */}
          {sites.length === 0 && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded mb-6">
              <p>サイトがありません。サイト設定から追加してください。</p>
              <button 
                onClick={() => router.push('/sites/edit')} 
                className="mt-2 bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
              >
                サイト設定へ
              </button>
            </div>
          )}
          
          {/* 期間選択ボタン */}
          {selectedSite && renderDateRangeButtons()}
          
          {/* データ読み込み中 */}
          {isLoading && (
            <div className="text-center p-10 bg-white rounded-lg shadow">
              <p className="text-gray-500">データを読み込んでいます...</p>
            </div>
          )}
          
          {/* アナリティクスデータ表示 */}
          {!isLoading && selectedSite && analyticsData && (
            <div className="space-y-6">
              {/* アクセス概要 - 1列表示 */}
              {renderOverviewData()}
              
              {/* デバイス別アクセスとアクセス参照元 - 2列表示 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {renderDeviceData()}
                {renderReferrerData()}
              </div>
              
              {/* 人気ページ - 1列表示 */}
              {renderTopPagesData()}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}