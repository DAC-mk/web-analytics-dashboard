import { NextRequest, NextResponse } from 'next/server';
import {
  getAllAnalyticsData,
  getClickEventData,
  getSearchTermData,
  getDateRangeFromParams
} from '@/lib/analytics';
import { db, auth } from '@/lib/firebase';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    // リクエストから必要なパラメータを抽出
    const { propertyId, dateRange } = await req.json();
    
    if (!propertyId) {
      return NextResponse.json(
        { error: 'Property ID is required' },
        { status: 400 }
      );
    }
    
    // すべてのアナリティクスデータを取得
    const data = await getAllAnalyticsData(propertyId, dateRange);
    
    return NextResponse.json({ data });
  } catch (error: unknown) {
    console.error('Error in analytics API:', error);
    
    let errorMessage = 'An unexpected error occurred';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}