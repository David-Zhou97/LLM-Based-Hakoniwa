import React from 'react';
import { Passage } from '../types';

interface NavBarProps {
  passages: Passage[];
  onNavigate: (passageId: string) => void;
  disabled?: boolean;
}

export const NavBar: React.FC<NavBarProps> = ({ passages, onNavigate, disabled }) => {
  if (passages.length === 0) return null;

  return (
    <div className="px-4 py-3 border-t border-niwa-border bg-niwa-surface/50">
      <div className="text-xs text-niwa-text-muted uppercase tracking-wider mb-2">
        Travel to:
      </div>
      <div className="flex flex-wrap gap-2">
        {passages.map((passage) => (
          <button
            key={passage.id}
            onClick={() => onNavigate(passage.id)}
            disabled={disabled}
            className={`nav-btn ${passage.is_new ? 'nav-btn-new' : ''} ${
              disabled ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {passage.label}
            {passage.is_new && (
              <span className="ml-1 text-xs text-niwa-accent">NEW</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
