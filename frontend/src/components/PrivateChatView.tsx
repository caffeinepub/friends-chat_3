import React, { useEffect, useRef, useState } from 'react';
import { Principal } from '@dfinity/principal';
import {
  usePrivateThread,
  useStartPrivateThread,
  useSendPrivateMessage,
  useGetUserProfile,
} from '../hooks/useQueries';
import type { UserProfile } from '../backend';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Send, Video } from 'lucide-react';

interface PrivateChatViewProps {
  friendPrincipal: Principal;
  currentUserProfile: UserProfile;
  onBack: () => void;
  onVideoCall?: (principal: Principal) => void;
}

function isOnline(profile: UserProfile): boolean {
  if (profile.isOnline) return true;
  const fiveMinutesAgo = BigInt(Date.now() - 5 * 60 * 1000) * BigInt(1_000_000);
  return profile.lastOnline > fiveMinutesAgo;
}

export default function PrivateChatView({
  friendPrincipal,
  currentUserProfile,
  onBack,
  onVideoCall,
}: PrivateChatViewProps) {
  const [messageContent, setMessageContent] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const threadStartedRef = useRef(false);

  const { data: friendProfile, isLoading: profileLoading } = useGetUserProfile(friendPrincipal);
  const { data: thread, isLoading: threadLoading, error: threadError } = usePrivateThread(friendPrincipal);
  const startThread = useStartPrivateThread();
  const sendMessage = useSendPrivateMessage();

  // Start thread if it doesn't exist yet (only once)
  useEffect(() => {
    if (
      !threadLoading &&
      thread === null &&
      !threadStartedRef.current &&
      !startThread.isPending
    ) {
      threadStartedRef.current = true;
      startThread.mutate(friendPrincipal);
    }
  }, [threadLoading, thread, friendPrincipal, startThread]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [thread?.messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = messageContent.trim();
    if (!trimmed || sendMessage.isPending) return;

    try {
      await sendMessage.mutateAsync({
        threadId: friendPrincipal,
        content: trimmed,
      });
      setMessageContent('');
    } catch (error) {
      console.error('Failed to send private message:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e as unknown as React.FormEvent);
    }
  };

  const messages = thread?.messages ?? [];
  const sortedMessages = [...messages].sort(
    (a, b) => Number(a.timestamp) - Number(b.timestamp)
  );

  const online = friendProfile ? isOnline(friendProfile) : false;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card">
        <Button variant="ghost" size="icon" onClick={onBack} title="Back">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        {profileLoading ? (
          <div className="flex items-center gap-2 flex-1">
            <Skeleton className="w-8 h-8 rounded-full" />
            <Skeleton className="h-4 w-32" />
          </div>
        ) : friendProfile ? (
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="relative flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                {friendProfile.displayName.slice(0, 2).toUpperCase()}
              </div>
              <span
                className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-card ${
                  online ? 'bg-green-500' : 'bg-muted-foreground/40'
                }`}
              />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{friendProfile.displayName}</p>
              <p className="text-xs text-muted-foreground">{online ? 'Online' : 'Offline'}</p>
            </div>
          </div>
        ) : (
          <div className="flex-1">
            <p className="text-sm font-semibold text-muted-foreground">Unknown User</p>
          </div>
        )}
        {onVideoCall && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onVideoCall(friendPrincipal)}
            title="Video call"
          >
            <Video className="w-5 h-5" />
          </Button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ minHeight: 0 }}>
        {(threadLoading || startThread.isPending) && (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className={`flex items-end gap-2 ${i % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}>
                <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
                <Skeleton className={`h-10 rounded-2xl ${i % 2 === 0 ? 'w-1/2' : 'w-2/5'}`} />
              </div>
            ))}
          </div>
        )}

        {threadError && (
          <div className="flex items-center justify-center h-full">
            <p className="text-destructive text-sm">Failed to load messages.</p>
          </div>
        )}

        {!threadLoading && !startThread.isPending && sortedMessages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground text-sm">
              No messages yet. Say hello to {friendProfile?.displayName ?? 'your friend'}!
            </p>
          </div>
        )}

        {sortedMessages.map((msg, idx) => {
          const isOwn = msg.sender === currentUserProfile.principal.toString();
          return (
            <div
              key={idx}
              className={`flex items-end gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                {isOwn
                  ? currentUserProfile.displayName.slice(0, 2).toUpperCase()
                  : (friendProfile?.displayName ?? '?').slice(0, 2).toUpperCase()}
              </div>
              <div
                className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm break-words ${
                  isOwn
                    ? 'bg-primary text-primary-foreground rounded-br-sm'
                    : 'bg-card border border-border text-foreground rounded-bl-sm'
                }`}
              >
                {msg.content}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSend}
        className="flex items-center gap-2 px-4 py-3 border-t border-border bg-card"
      >
        <Input
          value={messageContent}
          onChange={e => setMessageContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message…"
          disabled={sendMessage.isPending || threadLoading || startThread.isPending}
          className="flex-1"
          autoComplete="off"
        />
        <Button
          type="submit"
          size="icon"
          disabled={!messageContent.trim() || sendMessage.isPending || threadLoading || startThread.isPending}
          className="flex-shrink-0"
        >
          {sendMessage.isPending ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </form>
    </div>
  );
}
