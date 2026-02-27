import { useState } from 'react';
import MessageFeed from './MessageFeed';
import MessageInput from './MessageInput';
import DisplayNamePrompt from './DisplayNamePrompt';
import { useMessages } from '../hooks/useQueries';

export default function ChatView() {
  const [displayName, setDisplayName] = useState<string | null>(() => {
    return localStorage.getItem('chat_display_name');
  });

  const { data: messages = [], isLoading } = useMessages();

  const handleSetName = (name: string) => {
    localStorage.setItem('chat_display_name', name);
    setDisplayName(name);
  };

  if (!displayName) {
    return <DisplayNamePrompt onSubmit={handleSetName} />;
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 bg-card border-b border-border shadow-sm">
        <img
          src="/assets/generated/chat-logo.dim_256x256.png"
          alt="Friends Chat"
          className="w-9 h-9 rounded-xl object-cover"
        />
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-foreground leading-tight tracking-tight">
            Friends Chat
          </h1>
          <p className="text-xs text-muted-foreground">
            Chatting as <span className="font-semibold text-primary">{displayName}</span>
          </p>
        </div>
        <button
          onClick={() => {
            localStorage.removeItem('chat_display_name');
            setDisplayName(null);
          }}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted"
        >
          Change name
        </button>
      </header>

      {/* Message Feed */}
      <main className="flex-1 overflow-hidden">
        <MessageFeed
          messages={messages}
          currentUser={displayName}
          isLoading={isLoading}
        />
      </main>

      {/* Input */}
      <footer className="border-t border-border bg-card px-4 py-3">
        <MessageInput sender={displayName} />
      </footer>

      {/* App Footer */}
      <div className="text-center py-2 text-xs text-muted-foreground bg-background border-t border-border">
        Built with{' '}
        <span className="text-coral-500" aria-label="love">
          ♥
        </span>{' '}
        using{' '}
        <a
          href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname || 'unknown-app')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-primary hover:underline"
        >
          caffeine.ai
        </a>{' '}
        &copy; {new Date().getFullYear()}
      </div>
    </div>
  );
}
