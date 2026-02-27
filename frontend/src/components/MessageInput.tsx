import React, { useState } from 'react';
import { usePostMessage } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send } from 'lucide-react';

interface MessageInputProps {
  senderDisplayName: string;
}

export default function MessageInput({ senderDisplayName }: MessageInputProps) {
  const [content, setContent] = useState('');
  const postMessage = usePostMessage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || postMessage.isPending) return;

    try {
      await postMessage.mutateAsync({ sender: senderDisplayName, content: trimmed });
      setContent('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-2 px-4 py-3 border-t border-border bg-card"
    >
      <Input
        value={content}
        onChange={e => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a message…"
        disabled={postMessage.isPending}
        className="flex-1"
        autoComplete="off"
      />
      <Button
        type="submit"
        size="icon"
        disabled={!content.trim() || postMessage.isPending}
        className="flex-shrink-0"
      >
        {postMessage.isPending ? (
          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <Send className="w-4 h-4" />
        )}
      </Button>
    </form>
  );
}
