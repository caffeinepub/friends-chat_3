import React, { useEffect, useRef, useState } from 'react';
import { UserProfile } from '../backend';
import { useGetPrivateThread, useSendPrivateMessage } from '../hooks/useQueries';
import { ArrowLeft, Video, Send, Loader2 } from 'lucide-react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';

interface PrivateChatViewProps {
  friend: UserProfile;
  currentUserProfile: UserProfile;
  onBack: () => void;
  onStartVideoCall: () => void;
}

function getInitials(name: string) {
  return name.charAt(0).toUpperCase();
}

function formatTime(timestamp: bigint) {
  const ms = Number(timestamp / BigInt(1_000_000));
  return new Date(ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function PrivateChatView({
  friend,
  currentUserProfile,
  onBack,
  onStartVideoCall,
}: PrivateChatViewProps) {
  const { identity } = useInternetIdentity();
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const threadStartedRef = useRef(false);

  const friendPrincipal = friend.principal;
  const { data: thread, isLoading: threadLoading } = useGetPrivateThread(friendPrincipal);
  const sendMessage = useSendPrivateMessage();

  // Start thread once
  useEffect(() => {
    if (!threadStartedRef.current && identity) {
      threadStartedRef.current = true;
    }
  }, [identity]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thread?.messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    setInput('');
    await sendMessage.mutateAsync({ threadId: friendPrincipal, content: trimmed });
  };

  const myPrincipal = identity?.getPrincipal().toString();
  const messages = thread?.messages ?? [];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card flex-shrink-0">
        <button
          onClick={onBack}
          className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className="relative flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
            {getInitials(friend.displayName)}
          </div>
          {friend.isOnline && (
            <span className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 border-2 border-card rounded-full" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{friend.displayName}</p>
          <p className="text-xs text-muted-foreground">@{friend.username}</p>
        </div>

        {/* Video call button */}
        <button
          onClick={onStartVideoCall}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          title={`Video call ${friend.displayName}`}
        >
          <Video className="w-4 h-4" />
          <span className="hidden sm:inline">Call</span>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
        {threadLoading && (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
          </div>
        )}

        {!threadLoading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-xl">{getInitials(friend.displayName)}</span>
            </div>
            <p className="text-sm font-medium text-foreground">{friend.displayName}</p>
            <p className="text-xs text-muted-foreground">Start a conversation!</p>
          </div>
        )}

        {messages.map((msg, idx) => {
          const isOwn = msg.sender === myPrincipal;
          return (
            <div key={idx} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
              {!isOwn && (
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary mr-2 flex-shrink-0 self-end">
                  {getInitials(friend.displayName)}
                </div>
              )}
              <div
                className={`max-w-[70%] px-3 py-2 rounded-2xl text-sm ${
                  isOwn
                    ? 'bg-primary text-primary-foreground rounded-br-sm'
                    : 'bg-muted text-foreground rounded-bl-sm'
                }`}
              >
                <p>{msg.content}</p>
                <p className={`text-xs mt-1 ${isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                  {formatTime(msg.timestamp)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="flex items-center gap-2 px-4 py-3 border-t border-border bg-card flex-shrink-0">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Message ${friend.displayName}…`}
          className="flex-1 px-4 py-2 text-sm bg-muted rounded-full border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
          disabled={sendMessage.isPending}
        />
        <button
          type="submit"
          disabled={!input.trim() || sendMessage.isPending}
          className="w-9 h-9 flex items-center justify-center bg-primary text-primary-foreground rounded-full hover:opacity-90 transition-opacity disabled:opacity-40"
        >
          {sendMessage.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </form>
    </div>
  );
}
