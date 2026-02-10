import React from 'react';
import { useGameState } from './hooks/useGameState';
import { TitleScreen } from './components/TitleScreen';
import { ScenePanel } from './components/ScenePanel';
import { ChatArea } from './components/ChatArea';
import { ChoicePanel } from './components/ChoicePanel';
import { NavBar } from './components/NavBar';
import { EndingScreen } from './components/EndingScreen';

const App: React.FC = () => {
  const {
    state,
    connected,
    startGame,
    sendChoice,
    navigatePassage,
    restartGame,
  } = useGameState();

  // Title screen
  if (state.phase === 'title') {
    return <TitleScreen onStart={startGame} connected={connected} />;
  }

  // Ending screen
  if (state.phase === 'ending' && state.ending) {
    return <EndingScreen ending={state.ending} onRestart={restartGame} />;
  }

  // Loading state
  if (state.phase === 'loading' && !state.gardenDisplay) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4 animate-fade-in">
          <div className="text-4xl animate-pulse-soft">🌸</div>
          <p className="text-niwa-text-dim text-sm">Loading your story...</p>
        </div>
      </div>
    );
  }

  // Main game view
  return (
    <div className="h-screen flex flex-col bg-niwa-bg">
      {/* Header */}
      <header className="flex-shrink-0 px-4 py-2 border-b border-niwa-border bg-niwa-surface/50 backdrop-blur-sm">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm">🌸</span>
            <span className="text-xs text-niwa-text-muted font-mono tracking-wider">NIWA</span>
          </div>
          <div className="text-xs text-niwa-text-muted">
            {state.gardenDisplay?.name || 'Loading...'}
          </div>
          <button
            onClick={restartGame}
            className="text-xs text-niwa-text-muted hover:text-niwa-danger transition-colors"
          >
            Restart
          </button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full overflow-hidden">
        {/* Scene Panel */}
        <div className="flex-shrink-0 p-4 pb-0">
          <ScenePanel display={state.gardenDisplay} />
        </div>

        {/* Chat Area */}
        <ChatArea
          messages={state.messages}
          isWaiting={state.isWaitingForResponse}
        />

        {/* Choice Panel (3 dialogue options) */}
        <div className="flex-shrink-0">
          <ChoicePanel
            choices={state.choices}
            onSelect={sendChoice}
            disabled={state.isWaitingForResponse}
          />
        </div>

        {/* Navigation Bar (passage buttons) */}
        <div className="flex-shrink-0">
          <NavBar
            passages={state.passages}
            onNavigate={navigatePassage}
            disabled={state.isWaitingForResponse}
          />
        </div>
      </div>

      {/* Connection indicator */}
      {!connected && (
        <div className="fixed bottom-4 right-4 px-3 py-1.5 bg-niwa-danger/20 border border-niwa-danger/50 rounded-lg">
          <span className="text-xs text-niwa-danger">Disconnected</span>
        </div>
      )}

      {/* Error display */}
      {state.error && (
        <div className="fixed top-4 right-4 px-4 py-2 bg-niwa-danger/20 border border-niwa-danger/50 rounded-lg animate-slide-up">
          <span className="text-xs text-niwa-danger">{state.error}</span>
        </div>
      )}
    </div>
  );
};

export default App;
