// src/app/api/analytics/route.ts
import { NextResponse } from 'next/server';
import { 
  getAnalyticsReport,
  getSiteAnalyticsData,
  getTopPagesData,
  getDeviceData,
  getReferrerData,
  getClickEventsData,
  getSearchTermsData,
  DateRangeParams
} from '@/lib/analytics';
import { auth } from '@/lib/firebase';
import { cookies } from 'next/headers';

// GETリクエスト処理 - 特定のデータタイプを取得
export async function GET(request: Request) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const propertyId = searchParams.get('propertyId');
    const dataType = searchParams.get('type') || 'overview';
    const rangeType = searchParams.get('range') || 'week';
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit') as string, 10) : 10;
    
    if (!propertyId) {
      return NextResponse.json({ error: 'Property ID is required' }, { status: 400 });
    }
    
    const dateParams: DateRangeParams = {
      type: rangeType as any,
      startDate,
      endDate
    };
    
    let data;
    
    switch(dataType) {
      case 'overview':
        data = await getAnalyticsReport(propertyId, dateParams);
        break;
        
      case 'topPages':
        data = await getTopPagesData(propertyId, dateParams, limit);
        break;
        
      case 'devices':
        data = await getDeviceData(propertyId, dateParams);
        break;
        
      case 'referrers':
        data = await getReferrerData(propertyId, dateParams, limit);
        break;
        
      case 'clicks':
        data = await getClickEventsData(propertyId, dateParams, limit);
        break;
        
      case 'searchTerms':
        data = await getSearchTermsData(propertyId, dateParams, limit);
        break;
        
      case 'all':
        data = await getSiteAnalyticsData(propertyId, dateParams);
        break;
        
      default:
        data = await getAnalyticsReport(propertyId, dateParams);
    }
    
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error in analytics API route:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}

// POSTリクエスト処理 - 複数のデータタイプを一度に取得
export async function POST(request: Request) {
  try {
    const { propertyId, dateRange } = await request.json();
    
    if (!propertyId) {
      return NextResponse.json(
        { error: 'Property ID is required' },
        { status: 400 }
      );
    }
    
    const dateParams: DateRangeParams = dateRange || { type: 'week' };
    
    const data = await getSiteAnalyticsData(propertyId, dateParams);
    
    return NextResponse.json({ data });
    
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}