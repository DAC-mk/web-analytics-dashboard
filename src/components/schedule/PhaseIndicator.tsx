import React from 'react';
import { ProjectPhase } from '../../types/schedule';

interface PhaseIndicatorProps {
  currentPhase: ProjectPhase;
  onPhaseChange?: (phase: ProjectPhase) => void;
  isAdmin: boolean;
}

export default function PhaseIndicator({ 
  currentPhase, 
  onPhaseChange,
  isAdmin
}: PhaseIndicatorProps) {
  const phases: ProjectPhase[] = ['design', 'coding', 'testing', 'preparation', 'live'];
  const phaseLabels: Record<ProjectPhase, string> = {
    design: 'デザイン',
    coding: 'コーディング',
    testing: 'テスト・調整',
    preparation: '公開準備',
    live: '公開済み'
  };
  
  // 現在のフェーズのインデックスを取得
  const currentIndex = phases.indexOf(currentPhase);
  
  return (
    <div className="flex items-center space-x-1 w-full my-4">
      {phases.map((phase, index) => {
        // 現在のフェーズまでアクティブ表示
        const isActive = index <= currentIndex;
        // 現在のフェーズをハイライト
        const isCurrent = phase === currentPhase;
        
        return (
          <React.Fragment key={phase}>
            {/* フェーズ円 */}
            <button
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors
                ${isActive 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-500'}
                ${isCurrent ? 'ring-2 ring-blue-300 ring-offset-2' : ''}
                ${isAdmin ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
              onClick={() => isAdmin && onPhaseChange && onPhaseChange(phase)}
              disabled={!isAdmin}
            >
              {index + 1}
            </button>
            
            {/* フェーズラベル */}
            <div className="text-xs text-center">{phaseLabels[phase]}</div>
            
            {/* 接続線（最後のフェーズ以外） */}
            {index < phases.length - 1 && (
              <div 
                className={`flex-grow h-1 ${
                  index < currentIndex ? 'bg-blue-500' : 'bg-gray-200'
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}