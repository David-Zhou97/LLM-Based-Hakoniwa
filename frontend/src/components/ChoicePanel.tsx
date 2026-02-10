import React from 'react';
import { PlayerChoice } from '../types';

interface ChoicePanelProps {
  choices: PlayerChoice[];
  onSelect: (choice: PlayerChoice) => void;
  disabled?: boolean;
}

const choiceLabels = ['A', 'B', 'C'];

export const ChoicePanel: React.FC<ChoicePanelProps> = ({ choices, onSelect, disabled }) => {
  if (choices.length === 0) return null;

  return (
    <div className="px-4 py-3 space-y-2 border-t border-niwa-border bg-niwa-bg/80 backdrop-blur-sm">
      <div className="text-xs text-niwa-text-muted uppercase tracking-wider mb-2">
        Choose your response:
      </div>
      {choices.map((choice, index) => (
        <button
          key={choice.id}
          onClick={() => onSelect(choice)}
          disabled={disabled}
          className={`choice-btn flex items-start gap-3 ${
            disabled ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-niwa-primary/20 text-niwa-primary
                         flex items-center justify-center text-xs font-bold mt-0.5">
            {choiceLabels[index] || index + 1}
          </span>
          <span className="flex-1">{choice.text}</span>
        </button>
      ))}
    </div>
  );
};
