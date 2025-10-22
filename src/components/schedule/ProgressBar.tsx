import React from 'react';

interface ProgressBarProps {
  progress: number;
}

export default function ProgressBar({ progress }: ProgressBarProps) {
  return (
    <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
      <div 
        className="h-full bg-blue-500 transition-all duration-500"
        style={{ width: `${progress}%` }}
      >
      </div>
      <div className="text-xs font-medium text-center mt-1">{progress}%</div>
    </div>
  );
}