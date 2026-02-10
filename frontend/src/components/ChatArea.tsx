import React, { useEffect, useRef } from 'react';
import { ChatMessage } from '../types';

interface ChatAreaProps {
  messages: ChatMessage[];
  isWaiting: boolean;
}

const TypingIndicator: React.FC = () => (
  <div className="flex items-start gap-3 animate-fade-in">
    <div className="chat-bubble chat-bubble-npc flex items-center gap-1">
      <span className="w-2 h-2 bg-niwa-text-dim rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
      <span className="w-2 h-2 bg-niwa-text-dim rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
      <span className="w-2 h-2 bg-niwa-text-dim rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  </div>
);

const MessageBubble: React.FC<{ message: ChatMessage }> = ({ message }) => {
  if (message.role === 'system') {
    return (
      <div className="chat-bubble chat-bubble-system py-2">
        {message.content}
      </div>
    );
  }

  const isNpc = message.role === 'npc';

  return (
    <div className={`flex ${isNpc ? 'justify-start' : 'justify-end'} animate-slide-up`}>
      <div className={`chat-bubble ${isNpc ? 'chat-bubble-npc' : 'chat-bubble-player'}`}>
        {isNpc && (
          <div className="text-xs text-niwa-primary font-semibold mb-1 tracking-wide uppercase">
            NPC
          </div>
        )}
        <div className="text-sm leading-relaxed whitespace-pre-wrap">
          {message.content}
        </div>
      </div>
    </div>
  );
};

export const ChatArea: React.FC<ChatAreaProps> = ({ messages, isWaiting }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isWaiting]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} />
      ))}
      {isWaiting && <TypingIndicator />}
      <div ref={bottomRef} />
    </div>
  );
};
