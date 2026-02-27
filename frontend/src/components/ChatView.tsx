import React, { useState, useEffect } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { Principal } from '@dfinity/principal';
import MessageFeed from './MessageFeed';
import MessageInput from './MessageInput';
import FriendsPanel from './FriendsPanel';
import PrivateChatView from './PrivateChatView';
import ProfileSetupModal from './ProfileSetupModal';
import VideoCallModal from './VideoCallModal';
import { useVideoCall } from '../hooks/useVideoCall';
import { useGetCallerUserProfile, useUpdateOnlineStatus } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Users, MessageCircle, LogOut, LogIn } from 'lucide-react';

export default function ChatView() {
  const { identity, login, clear, loginStatus } = useInternetIdentity();
  const queryClient = useQueryClient();
  const isAuthenticated = !!identity;

  const [showFriends, setShowFriends] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<Principal | null>(null);
  const [callFriend, setCallFriend] = useState<Principal | null>(null);

  const {
    data: userProfile,
    isLoading: profileLoading,
    isFetched,
  } = useGetCallerUserProfile();

  const updateOnlineStatus = useUpdateOnlineStatus();

  const {
    isCallActive,
    isMuted,
    isCameraOff,
    startCall,
    endCall,
    toggleMute,
    toggleCamera,
    localVideoRef,
  } = useVideoCall();

  // Update online status on mount/unmount
  useEffect(() => {
    if (isAuthenticated && userProfile) {
      updateOnlineStatus.mutate(true);
    }
    return () => {
      if (isAuthenticated && userProfile) {
        updateOnlineStatus.mutate(false);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, !!userProfile]);

  const handleLogout = async () => {
    if (userProfile) {
      try {
        await updateOnlineStatus.mutateAsync(false);
      } catch {
        // ignore
      }
    }
    await clear();
    queryClient.clear();
    setSelectedFriend(null);
    setShowFriends(false);
  };

  const handleLogin = async () => {
    try {
      await login();
    } catch (error: unknown) {
      const err = error as Error;
      if (err?.message === 'User is already authenticated') {
        await clear();
        setTimeout(() => login(), 300);
      }
    }
  };

  const handleSelectFriend = (principal: Principal) => {
    setSelectedFriend(principal);
    setShowFriends(false);
  };

  const handleStartCall = (friendPrincipal: Principal) => {
    setCallFriend(friendPrincipal);
    startCall();
  };

  const handleEndCall = () => {
    endCall();
    setCallFriend(null);
  };

  // Prevent flash of profile setup modal
  const showProfileSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null;

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-card border-b border-border shadow-sm">
        <div className="flex items-center gap-3">
          <img src="/assets/generated/chat-logo.dim_256x256.png" alt="Friends Chat" className="w-8 h-8 rounded-lg" />
          <h1 className="text-xl font-bold text-primary">Friends Chat</h1>
        </div>
        <div className="flex items-center gap-2">
          {isAuthenticated && userProfile && (
            <>
              <span className="text-sm text-muted-foreground hidden sm:block">
                {userProfile.displayName}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setShowFriends(v => !v);
                  setSelectedFriend(null);
                }}
                title="Friends"
              >
                <Users className="w-5 h-5" />
              </Button>
            </>
          )}
          {isAuthenticated ? (
            <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout">
              <LogOut className="w-5 h-5" />
            </Button>
          ) : (
            <Button
              variant="default"
              size="sm"
              onClick={handleLogin}
              disabled={loginStatus === 'logging-in'}
            >
              {loginStatus === 'logging-in' ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Logging in…
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <LogIn className="w-4 h-4" />
                  Login
                </span>
              )}
            </Button>
          )}
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Friends panel */}
        {showFriends && isAuthenticated && userProfile && (
          <aside className="w-72 border-r border-border bg-card flex-shrink-0 overflow-hidden flex flex-col">
            <FriendsPanel
              onSelectFriend={handleSelectFriend}
              onVideoCall={handleStartCall}
            />
          </aside>
        )}

        {/* Chat area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {selectedFriend && isAuthenticated && userProfile ? (
            <PrivateChatView
              friendPrincipal={selectedFriend}
              currentUserProfile={userProfile}
              onBack={() => setSelectedFriend(null)}
              onVideoCall={handleStartCall}
            />
          ) : (
            <>
              {/* Public chat */}
              {!isAuthenticated && (
                <div className="flex-1 flex items-center justify-center p-8">
                  <div className="text-center max-w-sm">
                    <img
                      src="/assets/generated/friends-chat-icon.dim_512x512.png"
                      alt="Friends Chat"
                      className="w-24 h-24 mx-auto mb-4 rounded-2xl shadow-lg"
                    />
                    <h2 className="text-2xl font-bold text-foreground mb-2">Welcome to Friends Chat</h2>
                    <p className="text-muted-foreground mb-6">
                      Login to chat with friends, send private messages, and make video calls.
                    </p>
                    <Button onClick={handleLogin} disabled={loginStatus === 'logging-in'} size="lg">
                      {loginStatus === 'logging-in' ? 'Logging in…' : 'Login to get started'}
                    </Button>
                  </div>
                </div>
              )}
              {isAuthenticated && (
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="px-4 py-2 border-b border-border bg-card/50 flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">Public Chat</span>
                  </div>
                  <MessageFeed currentUserDisplayName={userProfile?.displayName} />
                  {userProfile && (
                    <MessageInput senderDisplayName={userProfile.displayName} />
                  )}
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Profile setup modal */}
      {showProfileSetup && (
        <ProfileSetupModal onComplete={() => {
          queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
        }} />
      )}

      {/* Video call modal */}
      {isCallActive && callFriend && (
        <VideoCallModal
          friendPrincipal={callFriend}
          isMuted={isMuted}
          isCameraOff={isCameraOff}
          onToggleMute={toggleMute}
          onToggleCamera={toggleCamera}
          onEndCall={handleEndCall}
          localVideoRef={localVideoRef}
        />
      )}

      {/* Footer */}
      <footer className="py-2 px-4 text-center text-xs text-muted-foreground border-t border-border bg-card">
        © {new Date().getFullYear()} Friends Chat &mdash; Built with{' '}
        <span className="text-primary">♥</span> using{' '}
        <a
          href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname || 'friends-chat')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-primary"
        >
          caffeine.ai
        </a>
      </footer>
    </div>
  );
}
