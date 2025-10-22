import { GoogleAuth } from 'google-auth-library';
import { BetaAnalyticsDataClient } from '@google-analytics/data';
import { credentials } from './firebase';

// 日付範囲パラメータの型定義
export interface DateRangeParams {
  type: 'day' | 'week' | 'month' | 'custom';
  startDate?: string;
  endDate?: string;
}

// AnalyticsのAPIレスポンス型
interface AnalyticsRow {
  dimensionValues: Array<{value: string}>;
  metricValues: Array<{value: string}>;
}

interface AnalyticsResponse {
  rows: AnalyticsRow[];
  rowCount: number;
  minimums?: AnalyticsRow[];
  maximums?: AnalyticsRow[];
  totals?: AnalyticsRow[];
  metricHeaders: Array<{name: string; type: string}>;
  dimensionHeaders: Array<{name: string}>;
}

interface ClickEventData {
  elementId: string;
  elementText: string;
  pageTitle: string;
  pagePath: string;
  timestamp: string;
}

// Google Analytics Dataクライアントの初期化
const analyticsDataClient = new BetaAnalyticsDataClient({
  auth: new GoogleAuth({
    credentials: credentials,
    scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
  }),
});

// 指定した日付範囲に基づいて適切な日付範囲を計算
export function getDateRangeFromParams(params: DateRangeParams): { startDate: string; endDate: string } {
  const now = new Date();
  let startDate: Date;
  let endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (params.type === 'custom' && params.startDate && params.endDate) {
    return {
      startDate: params.startDate,
      endDate: params.endDate,
    };
  }

  switch (params.type) {
    case 'day':
      // 当日のみ
      startDate = new Date(endDate);
      break;
    case 'week':
      // 過去7日間
      startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - 6);
      break;
    case 'month':
      // 過去30日間
      startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - 29);
      break;
    default:
      // デフォルトは過去7日間
      startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - 6);
  }

  // 'YYYY-MM-DD'形式で返す
  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return {
    startDate: formatDate(startDate),
    endDate: formatDate(endDate),
  };
}

// 総アクセス概要データの取得
export async function getOverviewData(propertyId: string, dateRange: DateRangeParams): Promise<AnalyticsResponse | null> {
  try {
    const { startDate, endDate } = getDateRangeFromParams(dateRange);
    
    const [response] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [
        {
          startDate,
          endDate,
        },
      ],
      dimensions: [
        {
          name: 'date',
        },
      ],
      metrics: [
        {
          name: 'screenPageViews',
        },
        {
          name: 'totalUsers',
        },
      ],
      orderBys: [
        {
          dimension: {
            dimensionName: 'date',
          },
          desc: false,
        },
      ],
    });
    
    return response;
  } catch (error) {
    console.error('Error fetching overview data:', error);
    return null;
  }
}

// 人気ページのデータ取得
export async function getTopPagesData(propertyId: string, dateRange: DateRangeParams): Promise<AnalyticsResponse | null> {
  try {
    const { startDate, endDate } = getDateRangeFromParams(dateRange);
    
    const [response] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [
        {
          startDate,
          endDate,
        },
      ],
      dimensions: [
        {
          name: 'pagePath',
        },
        {
          name: 'pageTitle',
        },
      ],
      metrics: [
        {
          name: 'screenPageViews',
        },
        {
          name: 'averageSessionDuration',
        },
      ],
      orderBys: [
        {
          metric: {
            metricName: 'screenPageViews',
          },
          desc: true,
        },
      ],
      limit: 50,
    });
    
    return response;
  } catch (error) {
    console.error('Error fetching top pages data:', error);
    return null;
  }
}

// デバイス別データの取得
export async function getDeviceData(propertyId: string, dateRange: DateRangeParams): Promise<AnalyticsResponse | null> {
  try {
    const { startDate, endDate } = getDateRangeFromParams(dateRange);
    
    const [response] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [
        {
          startDate,
          endDate,
        },
      ],
      dimensions: [
        {
          name: 'deviceCategory',
        },
      ],
      metrics: [
        {
          name: 'totalUsers',
        },
      ],
      orderBys: [
        {
          metric: {
            metricName: 'totalUsers',
          },
          desc: true,
        },
      ],
    });
    
    return response;
  } catch (error) {
    console.error('Error fetching device data:', error);
    return null;
  }
}

// 参照元データの取得
export async function getReferrerData(propertyId: string, dateRange: DateRangeParams): Promise<AnalyticsResponse | null> {
  try {
    const { startDate, endDate } = getDateRangeFromParams(dateRange);
    
    const [response] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [
        {
          startDate,
          endDate,
        },
      ],
      dimensions: [
        {
          name: 'sessionSource',
        },
      ],
      metrics: [
        {
          name: 'sessions',
        },
      ],
      orderBys: [
        {
          metric: {
            metricName: 'sessions',
          },
          desc: true,
        },
      ],
      limit: 20,
    });
    
    return response;
  } catch (error) {
    console.error('Error fetching referrer data:', error);
    return null;
  }
}

// クリックイベントデータの取得
export async function getClickEventData(propertyId: string, dateRange: DateRangeParams): Promise<AnalyticsResponse | null> {
  try {
    const { startDate, endDate } = getDateRangeFromParams(dateRange);
    
    const [response] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [
        {
          startDate,
          endDate,
        },
      ],
      dimensions: [
        {
          name: 'eventName',
        },
        {
          name: 'customEvent:element_id',
        },
        {
          name: 'customEvent:element_text',
        },
        {
          name: 'pageTitle',
        },
        {
          name: 'pagePath',
        },
      ],
      metrics: [
        {
          name: 'eventCount',
        },
      ],
      dimensionFilter: {
        filter: {
          fieldName: 'eventName',
          stringFilter: {
            value: 'click',
            matchType: 'EXACT',
          },
        },
      },
      orderBys: [
        {
          metric: {
            metricName: 'eventCount',
          },
          desc: true,
        },
      ],
      limit: 50,
    });
    
    return response;
  } catch (error) {
    console.error('Error fetching click event data:', error);
    return null;
  }
}

// 検索ワードデータの取得
export async function getSearchTermData(propertyId: string, dateRange: DateRangeParams): Promise<AnalyticsResponse | null> {
  try {
    const { startDate, endDate } = getDateRangeFromParams(dateRange);
    
    const [response] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [
        {
          startDate,
          endDate,
        },
      ],
      dimensions: [
        {
          name: 'sessionGoogleAdsKeyword',
        },
      ],
      metrics: [
        {
          name: 'sessions',
        },
      ],
      orderBys: [
        {
          metric: {
            metricName: 'sessions',
          },
          desc: true,
        },
      ],
      limit: 20,
    });
    
    return response;
  } catch (error) {
    console.error('Error fetching search term data:', error);
    return null;
  }
}

// GA4にクリックイベントを送信する関数
export function trackClick(elementId: string, elementText: string): void {
  // window.gtag が定義されていることを確認
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'click', {
      element_id: elementId,
      element_text: elementText,
    });
  }
}

// すべてのアナリティクスデータを一度に取得
export async function getAllAnalyticsData(propertyId: string, dateRange: DateRangeParams) {
  try {
    const [
      overview,
      topPages,
      deviceData,
      referrerData,
      clickEvents,
      searchTerms,
    ] = await Promise.all([
      getOverviewData(propertyId, dateRange),
      getTopPagesData(propertyId, dateRange),
      getDeviceData(propertyId, dateRange),
      getReferrerData(propertyId, dateRange),
      getClickEventData(propertyId, dateRange),
      getSearchTermData(propertyId, dateRange),
    ]);
    
    return {
      overview,
      topPages,
      deviceData,
      referrerData,
      clickEvents,
      searchTerms,
    };
  } catch (error) {
    console.error('Error fetching all analytics data:', error);
    throw error;
  }
}

// window.gtagの型を拡張
declare global {
  interface Window {
    gtag?: (command: string, action: string, params: Record<string, unknown>) => void;
  }
}