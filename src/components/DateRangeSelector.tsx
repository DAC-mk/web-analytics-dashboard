// src/components/DateRangeSelector.tsx
'use client';

import { useState } from 'react';
import { DateRangeParams } from '@/lib/analytics';

interface DateRangeSelectorProps {
  onChange: (dateRange: DateRangeParams) => void;
  initialValue?: DateRangeParams;
}

export default function DateRangeSelector({ onChange, initialValue = { type: 'week' } }: DateRangeSelectorProps) {
  const [selectedRange, setSelectedRange] = useState<string>(initialValue.type);
  const [startDate, setStartDate] = useState<string>(initialValue.startDate || '');
  const [endDate, setEndDate] = useState<string>(initialValue.endDate || '');
  const [showCustom, setShowCustom] = useState<boolean>(initialValue.type === 'custom');

  const handleRangeChange = (value: string) => {
    setSelectedRange(value);
    setShowCustom(value === 'custom');
    
    if (value !== 'custom') {
      onChange({ type: value as 'day' | 'week' | 'month' });
    } else {
      if (startDate && endDate) {
        onChange({ type: 'custom', startDate, endDate });
      }
    }
  };

  const handleCustomDateChange = () => {
    if (startDate && endDate) {
      onChange({ type: 'custom', startDate, endDate });
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow mb-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex border rounded overflow-hidden">
          <button
            onClick={() => handleRangeChange('day')}
            className={`px-4 py-2 text-sm focus:outline-none ${
              selectedRange === 'day' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            日次
          </button>
          <button
            onClick={() => handleRangeChange('week')}
            className={`px-4 py-2 text-sm focus:outline-none ${
              selectedRange === 'week' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            週次
          </button>
          <button
            onClick={() => handleRangeChange('month')}
            className={`px-4 py-2 text-sm focus:outline-none ${
              selectedRange === 'month' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            月次
          </button>
          <button
            onClick={() => handleRangeChange('custom')}
            className={`px-4 py-2 text-sm focus:outline-none ${
              selectedRange === 'custom' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            カスタム
          </button>
        </div>

        {showCustom && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">開始日:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border rounded px-2 py-1 text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">終了日:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border rounded px-2 py-1 text-sm"
              />
            </div>
            <button
              onClick={handleCustomDateChange}
              className="mt-2 sm:mt-0 px-4 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
            >
              適用
            </button>
          </div>
        )}
      </div>
    </div>
  );
}