import { useState, useRef, type KeyboardEvent } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { usePostMessage } from '../hooks/useQueries';

interface MessageInputProps {
  sender: string;
}

export default function MessageInput({ sender }: MessageInputProps) {
  const [content, setContent] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { mutate: postMessage, isPending } = usePostMessage();

  const handleSubmit = () => {
    const trimmed = content.trim();
    if (!trimmed || isPending) return;

    postMessage(
      { sender, content: trimmed },
      {
        onSuccess: () => {
          setContent('');
          inputRef.current?.focus();
        },
      }
    );
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
      className="flex gap-2 items-center"
    >
      <Input
        ref={inputRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a message..."
        disabled={isPending}
        className="flex-1 rounded-full bg-muted border-0 focus-visible:ring-2 focus-visible:ring-ring px-4 py-2 text-sm"
        autoComplete="off"
      />
      <Button
        type="submit"
        size="icon"
        disabled={!content.trim() || isPending}
        className="rounded-full w-10 h-10 shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
      >
        {isPending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Send className="w-4 h-4" />
        )}
      </Button>
    </form>
  );
}
