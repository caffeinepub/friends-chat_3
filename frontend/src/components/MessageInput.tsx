import React, { useState } from 'react';
import { UserProfile } from '../backend';
import { usePostMessage } from '../hooks/useQueries';
import { Send, Loader2 } from 'lucide-react';

interface MessageInputProps {
  currentUserProfile: UserProfile;
}

export default function MessageInput({ currentUserProfile }: MessageInputProps) {
  const [input, setInput] = useState('');
  const postMessage = usePostMessage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || postMessage.isPending) return;

    try {
      await postMessage.mutateAsync({
        sender: currentUserProfile.displayName,
        content: trimmed,
      });
      setInput('');
    } catch {
      // keep input on error
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 px-4 py-3">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Send a message to everyone…"
        disabled={postMessage.isPending}
        className="flex-1 px-4 py-2.5 text-sm bg-muted rounded-full border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors disabled:opacity-60"
      />
      <button
        type="submit"
        disabled={!input.trim() || postMessage.isPending}
        className="w-10 h-10 flex items-center justify-center bg-primary text-primary-foreground rounded-full hover:opacity-90 transition-opacity disabled:opacity-40 flex-shrink-0"
      >
        {postMessage.isPending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Send className="w-4 h-4" />
        )}
      </button>
    </form>
  );
}
