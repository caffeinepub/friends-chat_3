import React, { useState } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useActor } from '../hooks/useActor';
import { useGetCallerUserProfile } from '../hooks/useQueries';
import { useVideoCall } from '../hooks/useVideoCall';
import { useQueryClient } from '@tanstack/react-query';
import MessageFeed from './MessageFeed';
import MessageInput from './MessageInput';
import FriendsPanel from './FriendsPanel';
import PrivateChatView from './PrivateChatView';
import VideoCallModal from './VideoCallModal';
import ProfileSetupModal from './ProfileSetupModal';
import { UserProfile } from '../backend';
import { Users, MessageSquare, LogIn, LogOut, Loader2, Heart } from 'lucide-react';

export default function ChatView() {
  const { identity, login, clear, loginStatus, isInitializing } = useInternetIdentity();
  const { actor, isFetching: actorFetching } = useActor();
  const queryClient = useQueryClient();

  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === 'logging-in';

  const {
    data: userProfile,
    isLoading: profileLoading,
    isFetched: profileFetched,
  } = useGetCallerUserProfile();

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

  const handleLogin = async () => {
    try {
      await login();
    } catch (error: any) {
      console.error('Login error:', error);
      if (error?.message === 'User is already authenticated') {
        await clear();
        setTimeout(() => login(), 300);
      }
    }
  };

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
    setSelectedFriend(null);
  };

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

  // ── Loading: identity initializing or actor spinning up after login ──────────
  const isLoadingAuth = isInitializing || (isAuthenticated && actorFetching);

  if (isLoadingAuth) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground text-sm">
          {isInitializing ? 'Initializing…' : 'Connecting to network…'}
        </p>
      </div>
    );
  }

  // ── Not authenticated: show login screen ─────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src="/assets/generated/chat-logo.dim_256x256.png" alt="Friends Chat" className="w-8 h-8 rounded-lg" />
              <span className="font-bold text-lg text-foreground">Friends Chat</span>
            </div>
            <button
              onClick={handleLogin}
              disabled={isLoggingIn}
              className="flex items-center gap-2 px-5 py-2 rounded-full bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-60"
            >
              {isLoggingIn ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
              {isLoggingIn ? 'Logging in…' : 'Login'}
            </button>
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center px-4 py-16 text-center">
          <img
            src="/assets/generated/friends-chat-icon.dim_512x512.png"
            alt="Friends Chat"
            className="w-24 h-24 rounded-2xl shadow-lg mb-6"
          />
          <h1 className="text-4xl font-bold text-foreground mb-3">Friends Chat</h1>
          <p className="text-muted-foreground text-lg max-w-md mb-8">
            Stay connected with your friends. Send messages, make video calls, and more.
          </p>
          <button
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="flex items-center gap-2 px-8 py-3 rounded-full bg-primary text-primary-foreground font-semibold text-lg hover:bg-primary/90 transition-colors disabled:opacity-60 shadow-md"
          >
            {isLoggingIn ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
            {isLoggingIn ? 'Logging in…' : 'Login to get started'}
          </button>
          {loginStatus === 'error' as string && (
            <p className="mt-4 text-destructive text-sm">Login failed. Please try again.</p>
          )}
        </main>

        <footer className="border-t border-border py-4 text-center text-xs text-muted-foreground">
          <p>
            © {new Date().getFullYear()} Friends Chat &nbsp;·&nbsp; Built with{' '}
            <Heart className="inline w-3 h-3 text-primary fill-primary" /> using{' '}
            <a
              href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground"
            >
              caffeine.ai
            </a>
          </p>
        </footer>
      </div>
    );
  }

  // ── Authenticated but profile still loading ───────────────────────────────────
  if (isAuthenticated && actor && profileLoading && !profileFetched) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground text-sm">Loading your profile…</p>
      </div>
    );
  }

  // ── Profile setup for new users ───────────────────────────────────────────────
  const showProfileSetup =
    isAuthenticated && !actorFetching && !!actor && profileFetched && userProfile === null;

  if (showProfileSetup) {
    return (
      <div className="min-h-screen bg-background">
        <ProfileSetupModal onComplete={() => queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] })} />
      </div>
    );
  }

  // ── Main authenticated UI ─────────────────────────────────────────────────────
  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Header */}
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
        {/* Friends sidebar (desktop) */}
        <aside
          className={`
            flex-shrink-0 border-r border-border bg-card overflow-hidden transition-all duration-200
            hidden md:flex md:flex-col
            ${showFriendsSidebar ? 'md:w-72 lg:w-80' : 'md:w-0'}
          `}
        >
          {showFriendsSidebar && userProfile && (
            <FriendsPanel
              currentUserProfile={userProfile}
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
          {userProfile && (
            <FriendsPanel
              currentUserProfile={userProfile}
              onSelectFriend={(friend) => {
                setSelectedFriend(friend);
                setActiveTab('chat');
              }}
              selectedFriend={selectedFriend}
              onStartVideoCall={handleStartVideoCall}
            />
          )}
        </div>

        {/* Main chat area */}
        <main
          className={`
            flex-1 flex flex-col overflow-hidden
            ${activeTab === 'chat' ? 'flex' : 'hidden md:flex'}
          `}
        >
          {selectedFriend && userProfile ? (
            <PrivateChatView
              friend={selectedFriend}
              currentUserProfile={userProfile}
              onBack={() => setSelectedFriend(null)}
              onStartVideoCall={() => handleStartVideoCall(selectedFriend)}
            />
          ) : (
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
                {userProfile && <MessageFeed currentUserProfile={userProfile} />}
              </div>

              {/* Message input */}
              <div className="flex-shrink-0 border-t border-border bg-card">
                {userProfile && <MessageInput currentUserProfile={userProfile} />}
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
