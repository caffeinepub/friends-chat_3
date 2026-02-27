import React, { useEffect, useRef } from 'react';
import { UserProfile } from '../backend';
import { useGetMessages } from '../hooks/useQueries';
import { Loader2 } from 'lucide-react';

interface MessageFeedProps {
  currentUserProfile: UserProfile;
}

const AVATAR_COLORS = [
  'bg-rose-400',
  'bg-orange-400',
  'bg-amber-400',
  'bg-lime-500',
  'bg-teal-500',
  'bg-cyan-500',
  'bg-blue-500',
  'bg-violet-500',
  'bg-pink-500',
];

function getAvatarColor(sender: string): string {
  let hash = 0;
  for (let i = 0; i < sender.length; i++) {
    hash = sender.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function formatTime(timestamp: bigint) {
  const ms = Number(timestamp / BigInt(1_000_000));
  return new Date(ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function MessageFeed({ currentUserProfile }: MessageFeedProps) {
  const { data: messages = [], isLoading } = useGetMessages();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sorted = [...messages].sort((a, b) => Number(a.timestamp - b.timestamp));

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
      </div>
    );
  }

  if (sorted.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-muted-foreground text-sm">No messages yet</p>
          <p className="text-muted-foreground/60 text-xs">Be the first to say hello! 👋</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
      {sorted.map((msg, idx) => {
        const isOwn = msg.sender === currentUserProfile.displayName ||
          msg.sender === currentUserProfile.username;
        const initials = msg.sender.charAt(0).toUpperCase();
        const avatarColor = getAvatarColor(msg.sender);

        return (
          <div key={idx} className={`flex items-end gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
            {/* Avatar */}
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${avatarColor}`}
            >
              {initials}
            </div>

            {/* Bubble */}
            <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
              {!isOwn && (
                <span className="text-xs text-muted-foreground mb-1 ml-1">{msg.sender}</span>
              )}
              <div
                className={`px-3 py-2 rounded-2xl text-sm ${
                  isOwn
                    ? 'bg-primary text-primary-foreground rounded-br-sm'
                    : 'bg-muted text-foreground rounded-bl-sm'
                }`}
              >
                <p>{msg.content}</p>
              </div>
              <span className="text-xs text-muted-foreground mt-1 mx-1">
                {formatTime(msg.timestamp)}
              </span>
            </div>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
