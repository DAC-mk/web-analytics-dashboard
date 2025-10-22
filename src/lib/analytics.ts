// src/lib/analytics.ts
import { BetaAnalyticsDataClient } from '@google-analytics/data';

// 期間タイプの定義
export type DateRange = 'day' | 'week' | 'month' | 'custom';

// 期間設定インターフェース
export interface DateRangeParams {
  type: DateRange;
  startDate?: string; // YYYY-MM-DD 形式 (カスタム期間用)
  endDate?: string;   // YYYY-MM-DD 形式 (カスタム期間用)
}

// サービスアカウントキーを使用して認証
const analyticsDataClient = new BetaAnalyticsDataClient({
  keyFilename: process.env.GA_KEY_PATH,
});

// 期間範囲の計算
export const calculateDateRange = (params: DateRangeParams): { startDate: string; endDate: string } => {
  let startDate: string;
  let endDate: string = 'today';
  
  switch(params.type) {
    case 'day':
      startDate = 'yesterday';
      break;
      
    case 'week':
      startDate = '7daysAgo';
      break;
      
    case 'month':
      startDate = '30daysAgo';
      break;
      
    case 'custom':
      if (params.startDate && params.endDate) {
        startDate = params.startDate;
        endDate = params.endDate;
      } else {
        // デフォルトは過去30日
        startDate = '30daysAgo';
      }
      break;
      
    default:
      // デフォルトは過去7日
      startDate = '7daysAgo';
  }
  
  return { startDate, endDate };
};

// 基本的なレポートを取得する関数
export async function getAnalyticsReport(propertyId: string, dateParams: DateRangeParams) {
  try {
    const { startDate, endDate } = calculateDateRange(dateParams);
    
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
        {
          name: 'sessions',
        },
      ],
    });
    
    return response;
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    throw error;
  }
}

// ページ別アクセスデータ取得
export async function getTopPagesData(propertyId: string, dateParams: DateRangeParams, limit = 10) {
  try {
    const { startDate, endDate } = calculateDateRange(dateParams);
    
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
      limit,
    });
    
    return response;
  } catch (error) {
    console.error('Error fetching top pages data:', error);
    throw error;
  }
}

// デバイスタイプ別データ取得
export async function getDeviceData(propertyId: string, dateParams: DateRangeParams) {
  try {
    const { startDate, endDate } = calculateDateRange(dateParams);
    
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
    });
    
    return response;
  } catch (error) {
    console.error('Error fetching device data:', error);
    throw error;
  }
}

// 参照元データ取得
export async function getReferrerData(propertyId: string, dateParams: DateRangeParams, limit = 10) {
  try {
    const { startDate, endDate } = calculateDateRange(dateParams);
    
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
      limit,
    });
    
    return response;
  } catch (error) {
    console.error('Error fetching referrer data:', error);
    throw error;
  }
}

// クリックイベントデータ取得
export async function getClickEventsData(propertyId: string, dateParams: DateRangeParams, limit = 10) {
  try {
    const { startDate, endDate } = calculateDateRange(dateParams);
    
    // クリックイベントが設定されている場合のみ機能します
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
            matchType: 'BEGINS_WITH',
            value: 'click',
          },
        },
      },
      limit,
    });
    
    return response;
  } catch (error) {
    console.error('Error fetching click events data:', error);
    throw error;
  }
}

// 検索キーワードデータ取得
export async function getSearchTermsData(propertyId: string, dateParams: DateRangeParams, limit = 10) {
  try {
    const { startDate, endDate } = calculateDateRange(dateParams);
    
    // 内部検索キーワードの取得（設定されている場合のみ機能します）
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
          name: 'searchTerm',
        },
      ],
      metrics: [
        {
          name: 'eventCount',
        },
      ],
      orderBys: [
        {
          metric: {
            metricName: 'eventCount',
          },
          desc: true,
        },
      ],
      limit,
    });
    
    return response;
  } catch (error) {
    console.error('Error fetching search terms data:', error);
    throw error;
  }
}

// すべてのサイト情報を一括取得する総合関数
export async function getSiteAnalyticsData(propertyId: string, dateParams: DateRangeParams) {
  try {
    // 並列でデータ取得
    const [overview, topPages, deviceData, referrerData] = await Promise.all([
      getAnalyticsReport(propertyId, dateParams),
      getTopPagesData(propertyId, dateParams),
      getDeviceData(propertyId, dateParams),
      getReferrerData(propertyId, dateParams),
    ]);
    
    // クリックイベントとキーワード検索は設定によって取得できない場合があるので分けて取得
    let clickEvents = null;
    let searchTerms = null;
    
    try {
      clickEvents = await getClickEventsData(propertyId, dateParams);
    } catch (error) {
      console.log('Click events data not available or not configured');
    }
    
    try {
      searchTerms = await getSearchTermsData(propertyId, dateParams);
    } catch (error) {
      console.log('Search terms data not available or not configured');
    }
    
    // すべてのデータを結合
    return {
      overview,
      topPages,
      deviceData,
      referrerData,
      clickEvents,
      searchTerms,
    };
    
  } catch (error) {
    console.error('Error fetching site analytics data:', error);
    throw error;
  }
}