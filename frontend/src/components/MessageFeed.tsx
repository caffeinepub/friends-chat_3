import React, { useEffect, useRef } from 'react';
import { useMessages } from '../hooks/useQueries';
import { Skeleton } from '@/components/ui/skeleton';

interface MessageFeedProps {
  currentUserDisplayName?: string;
}

function getAvatarColor(name: string): string {
  const colors = [
    'bg-coral-500',
    'bg-amber-500',
    'bg-teal-500',
    'bg-rose-500',
    'bg-indigo-500',
    'bg-emerald-500',
    'bg-orange-500',
    'bg-violet-500',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function MessageFeed({ currentUserDisplayName }: MessageFeedProps) {
  const { data: messages, isLoading, error } = useMessages();
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  if (isLoading) {
    return (
      <div className="flex-1 p-4 space-y-3 overflow-y-auto">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-start gap-3">
            <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
            <div className="space-y-1 flex-1">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-10 w-3/4 rounded-2xl" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <p className="text-destructive text-sm">Failed to load messages. Please try again.</p>
      </div>
    );
  }

  const sortedMessages = [...(messages ?? [])].sort(
    (a, b) => Number(a.timestamp) - Number(b.timestamp)
  );

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto p-4 space-y-3"
      style={{ minHeight: 0 }}
    >
      {sortedMessages.length === 0 && (
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground text-sm">No messages yet. Say hello!</p>
        </div>
      )}
      {sortedMessages.map((msg, idx) => {
        const isOwn = msg.sender === currentUserDisplayName;
        const avatarColor = getAvatarColor(msg.sender);
        const initials = getInitials(msg.sender);
        return (
          <div
            key={idx}
            className={`flex items-end gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
          >
            {/* Avatar */}
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${avatarColor}`}
            >
              {initials}
            </div>
            {/* Bubble */}
            <div className={`max-w-[70%] flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
              <span className="text-xs text-muted-foreground mb-1 break-all whitespace-normal w-full">
                {msg.sender}
              </span>
              <div
                className={`px-4 py-2 rounded-2xl text-sm break-words ${
                  isOwn
                    ? 'bg-primary text-primary-foreground rounded-br-sm'
                    : 'bg-card border border-border text-foreground rounded-bl-sm'
                }`}
              >
                {msg.content}
              </div>
              <span className="text-xs text-muted-foreground mt-1">
                {new Date(Number(msg.timestamp) / 1_000_000).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
