import React from 'react';
import { GardenDisplay } from '../types';

interface ScenePanelProps {
  display: GardenDisplay | null;
  isTransitioning?: boolean;
}

const sceneGradients: Record<string, string> = {
  'Corner Café': 'from-amber-900/40 to-orange-900/20',
  'Police Station': 'from-slate-800/40 to-blue-900/20',
  'Police Station (With Evidence)': 'from-slate-700/40 to-indigo-900/20',
  'The Lantern': 'from-red-900/40 to-rose-900/20',
  "Moriyama's Apartment": 'from-gray-800/40 to-neutral-900/20',
  'The Confrontation': 'from-zinc-900/40 to-slate-900/20',
  'default': 'from-indigo-900/40 to-purple-900/20',
};

const sceneIcons: Record<string, string> = {
  'Corner Café': '☕',
  'Police Station': '🚔',
  'Police Station (With Evidence)': '📋',
  'The Lantern': '🏮',
  "Moriyama's Apartment": '🏠',
  'The Confrontation': '⚔️',
  'default': '🌸',
};

export const ScenePanel: React.FC<ScenePanelProps> = ({ display, isTransitioning }) => {
  if (!display) return null;

  const gradient = sceneGradients[display.name] || sceneGradients['default'];
  const icon = sceneIcons[display.name] || sceneIcons['default'];

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-niwa-border transition-all duration-500 ${
        isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
      }`}
    >
      <div className={`bg-gradient-to-br ${gradient} p-5`}>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">{icon}</span>
          <h2 className="text-lg font-bold text-niwa-text tracking-wide">
            {display.name}
          </h2>
        </div>
        <p className="text-sm text-niwa-text-dim leading-relaxed italic">
          {display.description}
        </p>
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-niwa-bg/60 to-transparent pointer-events-none" />
    </div>
  );
};
