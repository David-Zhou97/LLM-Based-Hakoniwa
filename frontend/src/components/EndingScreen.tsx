import React from 'react';
import { ScoringDimension } from '../types';

interface EndingScreenProps {
  ending: {
    id: string;
    title: string;
    epilogue: string;
    scores: Record<string, ScoringDimension>;
  };
  onRestart: () => void;
}

const dimensionLabels: Record<string, string> = {
  truth: 'Truth',
  morality: 'Morality',
  empathy: 'Empathy',
  danger: 'Danger',
};

const dimensionColors: Record<string, string> = {
  truth: 'bg-blue-500',
  morality: 'bg-green-500',
  empathy: 'bg-pink-500',
  danger: 'bg-red-500',
};

export const EndingScreen: React.FC<EndingScreenProps> = ({ ending, onRestart }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <div className="max-w-lg w-full space-y-8 animate-fade-in">
        {/* Ending Title */}
        <div className="text-center space-y-4">
          <div className="text-5xl mb-2">
            {ending.id.includes('hidden') ? '✨' :
             ending.id.includes('justice') ? '⚖️' :
             ending.id.includes('dark') ? '🖤' : '🌙'}
          </div>
          <h1 className="text-3xl font-bold text-niwa-text">
            {ending.title}
          </h1>
          <div className="h-px bg-gradient-to-r from-transparent via-niwa-border to-transparent" />
        </div>

        {/* Epilogue */}
        <div className="bg-niwa-card border border-niwa-border rounded-2xl p-6">
          <p className="text-sm text-niwa-text-dim leading-relaxed italic whitespace-pre-wrap">
            {ending.epilogue}
          </p>
        </div>

        {/* Score Breakdown */}
        {ending.scores && Object.keys(ending.scores).length > 0 && (
          <div className="bg-niwa-card border border-niwa-border rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-semibold text-niwa-text-muted uppercase tracking-wider">
              Your Journey
            </h3>
            {Object.entries(ending.scores).map(([key, dim]) => {
              const label = dimensionLabels[key] || key;
              const color = dimensionColors[key] || 'bg-indigo-500';
              const range = dim.range[1] - dim.range[0];
              const normalized = range > 0
                ? ((dim.value - dim.range[0]) / range) * 100
                : 50;

              return (
                <div key={key} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-niwa-text-dim">{label}</span>
                    <span className="text-niwa-text font-mono">{dim.value}</span>
                  </div>
                  <div className="w-full h-2 bg-niwa-border rounded-full overflow-hidden">
                    <div
                      className={`h-full ${color} rounded-full transition-all duration-1000 ease-out`}
                      style={{ width: `${Math.max(2, normalized)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Restart */}
        <div className="text-center space-y-4">
          <button
            onClick={onRestart}
            className="px-8 py-3 rounded-xl bg-niwa-primary hover:bg-niwa-primary-glow
                     text-white font-semibold transition-all duration-300
                     shadow-lg shadow-niwa-primary/30 hover:shadow-niwa-primary/50"
          >
            Play Again
          </button>
          <p className="text-xs text-niwa-text-muted">
            Different choices lead to different endings. Try a new path.
          </p>
        </div>
      </div>
    </div>
  );
};
