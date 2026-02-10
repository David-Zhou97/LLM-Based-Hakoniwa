import React from 'react';

interface TitleScreenProps {
  onStart: () => void;
  connected: boolean;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({ onStart, connected }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="max-w-lg w-full text-center space-y-8 animate-fade-in">
        {/* Logo / Title */}
        <div className="space-y-4">
          <div className="text-6xl mb-4">🌸</div>
          <h1 className="text-4xl font-bold tracking-tight text-niwa-text">
            NIWA
          </h1>
          <p className="text-niwa-text-dim text-sm tracking-widest uppercase">
            Conversational Hakoniwa Engine
          </p>
        </div>

        {/* Story Card */}
        <div className="bg-niwa-card border border-niwa-border rounded-2xl p-6 text-left space-y-3">
          <h2 className="text-xl font-semibold text-niwa-text">
            Echoes at Eleven
          </h2>
          <p className="text-sm text-niwa-text-dim leading-relaxed">
            A journalist is found dead in his apartment. The police investigation has stalled.
            You arrive at a quiet corner cafe, hoping the waitress might know something.
            In this city of secrets, everyone is hiding something — and your choices
            will determine who faces justice and who walks free.
          </p>
          <div className="flex gap-4 text-xs text-niwa-text-muted pt-2">
            <span>Mystery</span>
            <span>~45 min</span>
            <span>Multiple endings</span>
          </div>
        </div>

        {/* Start Button */}
        <button
          onClick={onStart}
          disabled={!connected}
          className={`w-full py-4 rounded-xl font-semibold text-lg transition-all duration-300
            ${connected
              ? 'bg-niwa-primary hover:bg-niwa-primary-glow text-white shadow-lg shadow-niwa-primary/30 hover:shadow-niwa-primary/50'
              : 'bg-niwa-border text-niwa-text-muted cursor-not-allowed'
            }`}
        >
          {connected ? 'Begin Investigation' : 'Connecting to server...'}
        </button>

        {!connected && (
          <p className="text-xs text-niwa-danger animate-pulse-soft">
            Waiting for server connection...
          </p>
        )}

        {/* Footer */}
        <p className="text-xs text-niwa-text-muted">
          Each playthrough is unique. Your dialogue shapes the story.
        </p>
      </div>
    </div>
  );
};
