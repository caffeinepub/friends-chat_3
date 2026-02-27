import React, { useRef, useState, useEffect } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { useGetCallerUserProfile } from '../hooks/useQueries';
import { useVideoCall } from '../hooks/useVideoCall';
import MessageFeed from './MessageFeed';
import MessageInput from './MessageInput';
import FriendsPanel from './FriendsPanel';
import PrivateChatView from './PrivateChatView';
import VideoCallModal from './VideoCallModal';
import DisplayNamePrompt from './DisplayNamePrompt';
import { UserProfile } from '../backend';
import { MessageSquare, Users, LogOut, Video } from 'lucide-react';

const LOADING_TIMEOUT_MS = 10000;

export default function ChatView() {
  const { identity, clear, login, loginStatus } = useInternetIdentity();
  const queryClient = useQueryClient();
  const isAuthenticated = !!identity;

  const {
    data: userProfile,
    isLoading: profileLoading,
    isFetched,
    isError: profileError,
  } = useGetCallerUserProfile();

  // Timeout fallback: if loading takes more than 10s, force exit
  const [loadingTimedOut, setLoadingTimedOut] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoadingTimedOut(false);
      return;
    }

    // If already resolved, no need for timeout
    if (isFetched || profileError) return;

    const timer = setTimeout(() => {
      setLoadingTimedOut(true);
    }, LOADING_TIMEOUT_MS);

    return () => clearTimeout(timer);
  }, [isAuthenticated, isFetched, profileError]);

  // Reset timeout when auth state changes
  useEffect(() => {
    if (!isAuthenticated) {
      setLoadingTimedOut(false);
    }
  }, [isAuthenticated]);

  const [selectedFriend, setSelectedFriend] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'chat' | 'friends'>('chat');
  const [showFriendsSidebar, setShowFriendsSidebar] = useState(true);
  const [isVideoCallActive, setIsVideoCallActive] = useState(false);
  const [videoCallFriend, setVideoCallFriend] = useState<UserProfile | null>(null);

  const {
    localVideoRef,
    remoteAudioRef: hookRemoteAudioRef,
    isMuted,
    isCameraOff,
    startCall,
    endCall,
    toggleMute,
    toggleCamera,
  } = useVideoCall();

  // Determine if we're still in a loading state
  // Exit loading when: query is fetched, errored, or timed out
  const isStillLoading = isAuthenticated && profileLoading && !isFetched && !profileError && !loadingTimedOut;

  const showProfileSetup = isAuthenticated && !isStillLoading && (userProfile === null || userProfile === undefined) && !profileError;

  const handleStartVideoCall = (friend: UserProfile) => {
    setVideoCallFriend(friend);
    setIsVideoCallActive(true);
    startCall();
  };

  const handleEndCall = () => {
    endCall();
    setIsVideoCallActive(false);
    setVideoCallFriend(null);
  };

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
    setSelectedFriend(null);
    setLoadingTimedOut(false);
  };

  const handleLogin = async () => {
    try {
      await login();
    } catch (error: any) {
      if (error.message === 'User is already authenticated') {
        await clear();
        setTimeout(() => login(), 300);
      }
    }
  };

  // Not authenticated: show login screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        {/* Header */}
        <header className="bg-primary text-primary-foreground px-6 py-4 flex items-center gap-3 shadow-md">
          <img src="/assets/generated/chat-logo.dim_256x256.png" alt="Logo" className="w-9 h-9 rounded-full" />
          <h1 className="text-xl font-bold tracking-tight">Friends Chat</h1>
        </header>

        {/* Login hero */}
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center space-y-8">
            <div className="space-y-3">
              <img
                src="/assets/generated/friends-chat-icon.dim_512x512.png"
                alt="Friends Chat"
                className="w-24 h-24 mx-auto rounded-2xl shadow-lg"
              />
              <h2 className="text-3xl font-bold text-foreground">Stay Connected</h2>
              <p className="text-muted-foreground text-lg">
                Chat with friends, send messages, and video call — all in one place.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-card rounded-xl p-4 shadow-sm border border-border">
                <MessageSquare className="w-6 h-6 text-primary mx-auto mb-2" />
                <p className="text-sm font-medium text-foreground">Public Chat</p>
              </div>
              <div className="bg-card rounded-xl p-4 shadow-sm border border-border">
                <Users className="w-6 h-6 text-primary mx-auto mb-2" />
                <p className="text-sm font-medium text-foreground">Friends</p>
              </div>
              <div className="bg-card rounded-xl p-4 shadow-sm border border-border">
                <Video className="w-6 h-6 text-primary mx-auto mb-2" />
                <p className="text-sm font-medium text-foreground">Video Calls</p>
              </div>
            </div>

            <button
              onClick={handleLogin}
              disabled={loginStatus === 'logging-in'}
              className="w-full bg-primary text-primary-foreground py-3 px-6 rounded-xl font-semibold text-lg hover:opacity-90 transition-opacity disabled:opacity-50 shadow-md"
            >
              {loginStatus === 'logging-in' ? 'Logging in…' : 'Login to Get Started'}
            </button>
          </div>
        </main>

        <footer className="text-center py-4 text-xs text-muted-foreground">
          © {new Date().getFullYear()} Friends Chat · Built with ❤️ using{' '}
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

  // Loading profile — only shown while genuinely loading, max 10 seconds
  if (isStillLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading your profile…</p>
        </div>
      </div>
    );
  }

  // Profile error state (backend error, not just missing profile)
  if (profileError && !loadingTimedOut) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <header className="bg-primary text-primary-foreground px-6 py-4 flex items-center gap-3 shadow-md">
          <img src="/assets/generated/chat-logo.dim_256x256.png" alt="Logo" className="w-9 h-9 rounded-full" />
          <h1 className="text-xl font-bold tracking-tight">Friends Chat</h1>
        </header>
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-foreground">Something went wrong</h2>
              <p className="text-muted-foreground">
                We couldn't load your profile. This might be a temporary issue.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] })}
                className="bg-primary text-primary-foreground py-2 px-6 rounded-xl font-semibold hover:opacity-90 transition-opacity"
              >
                Try Again
              </button>
              <button
                onClick={handleLogout}
                className="bg-muted text-muted-foreground py-2 px-6 rounded-xl font-semibold hover:opacity-90 transition-opacity"
              >
                Logout
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Profile setup for new users (null profile = new user, or timed out = treat as new user)
  if (showProfileSetup || loadingTimedOut) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <header className="bg-primary text-primary-foreground px-6 py-4 flex items-center gap-3 shadow-md">
          <img src="/assets/generated/chat-logo.dim_256x256.png" alt="Logo" className="w-9 h-9 rounded-full" />
          <h1 className="text-xl font-bold tracking-tight">Friends Chat</h1>
        </header>
        <main className="flex-1 flex items-center justify-center p-6">
          <DisplayNamePrompt onComplete={() => {
            setLoadingTimedOut(false);
            queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
          }} />
        </main>
      </div>
    );
  }

  // Main authenticated UI
  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Top Header */}
      <header className="bg-primary text-primary-foreground px-4 py-3 flex items-center gap-3 shadow-md flex-shrink-0 z-10">
        <img src="/assets/generated/chat-logo.dim_256x256.png" alt="Logo" className="w-8 h-8 rounded-full" />
        <h1 className="text-lg font-bold tracking-tight flex-1">Friends Chat</h1>

        {/* Mobile tab switcher */}
        <div className="flex md:hidden items-center gap-1 bg-primary-foreground/10 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'chat'
                ? 'bg-primary-foreground text-primary'
                : 'text-primary-foreground/80 hover:text-primary-foreground'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Chat
          </button>
          <button
            onClick={() => setActiveTab('friends')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'friends'
                ? 'bg-primary-foreground text-primary'
                : 'text-primary-foreground/80 hover:text-primary-foreground'
            }`}
          >
            <Users className="w-4 h-4" />
            Friends
          </button>
        </div>

        {/* Desktop sidebar toggle */}
        <button
          onClick={() => setShowFriendsSidebar(!showFriendsSidebar)}
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-foreground/10 hover:bg-primary-foreground/20 text-sm font-medium transition-colors"
          title={showFriendsSidebar ? 'Hide Friends' : 'Show Friends'}
        >
          <Users className="w-4 h-4" />
          <span className="hidden lg:inline">Friends</span>
        </button>

        {/* User info + logout */}
        <div className="flex items-center gap-2">
          {userProfile && (
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-primary-foreground/20 flex items-center justify-center text-xs font-bold">
                {userProfile.displayName.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium hidden lg:inline">{userProfile.displayName}</span>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg hover:bg-primary-foreground/20 transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* ── FRIENDS SIDEBAR (desktop: always visible when toggled; mobile: tab) ── */}
        <aside
          className={`
            flex-shrink-0 border-r border-border bg-card overflow-hidden transition-all duration-200
            hidden md:flex md:flex-col
            ${showFriendsSidebar ? 'md:w-72 lg:w-80' : 'md:w-0'}
          `}
        >
          {showFriendsSidebar && (
            <FriendsPanel
              currentUserProfile={userProfile!}
              onSelectFriend={(friend) => {
                setSelectedFriend(friend);
                setActiveTab('chat');
              }}
              selectedFriend={selectedFriend}
              onStartVideoCall={handleStartVideoCall}
            />
          )}
        </aside>

        {/* Mobile Friends Tab */}
        <div
          className={`
            md:hidden flex-1 flex flex-col overflow-hidden
            ${activeTab === 'friends' ? 'flex' : 'hidden'}
          `}
        >
          <FriendsPanel
            currentUserProfile={userProfile!}
            onSelectFriend={(friend) => {
              setSelectedFriend(friend);
              setActiveTab('chat');
            }}
            selectedFriend={selectedFriend}
            onStartVideoCall={handleStartVideoCall}
          />
        </div>

        {/* ── MAIN CHAT AREA ── */}
        <main
          className={`
            flex-1 flex flex-col overflow-hidden
            ${activeTab === 'chat' ? 'flex' : 'hidden md:flex'}
          `}
        >
          {selectedFriend ? (
            /* Private Chat */
            <PrivateChatView
              friend={selectedFriend}
              currentUserProfile={userProfile!}
              onBack={() => setSelectedFriend(null)}
              onStartVideoCall={() => handleStartVideoCall(selectedFriend)}
            />
          ) : (
            /* Public Chat */
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Public chat header */}
              <div className="px-4 py-3 border-b border-border bg-card flex items-center gap-3 flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h2 className="font-semibold text-foreground text-sm">Public Chat</h2>
                  <p className="text-xs text-muted-foreground">Everyone can see these messages</p>
                </div>
              </div>

              {/* Message feed */}
              <div className="flex-1 overflow-hidden flex flex-col min-h-0">
                <MessageFeed currentUserProfile={userProfile!} />
              </div>

              {/* Message input */}
              <div className="flex-shrink-0 border-t border-border bg-card">
                <MessageInput currentUserProfile={userProfile!} />
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Video Call Modal */}
      {isVideoCallActive && videoCallFriend && (
        <VideoCallModal
          friend={videoCallFriend}
          localVideoRef={localVideoRef}
          remoteAudioRef={hookRemoteAudioRef}
          isMuted={isMuted}
          isCameraOff={isCameraOff}
          onToggleMute={toggleMute}
          onToggleCamera={toggleCamera}
          onEndCall={handleEndCall}
        />
      )}
    </div>
  );
}
