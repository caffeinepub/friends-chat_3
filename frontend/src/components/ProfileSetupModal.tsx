import React, { useState } from 'react';
import { useActor } from '../hooks/useActor';
import { useSaveCallerUserProfile } from '../hooks/useQueries';
import { Loader2, User, Heart } from 'lucide-react';

interface ProfileSetupModalProps {
  onComplete?: () => void;
}

export default function ProfileSetupModal({ onComplete }: ProfileSetupModalProps) {
  const { actor, isFetching: actorFetching } = useActor();
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  const saveProfile = useSaveCallerUserProfile();

  const actorReady = !!actor && !actorFetching;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!actorReady) {
      setError('Still connecting to the network. Please wait a moment and try again.');
      return;
    }

    const trimmedDisplay = displayName.trim();
    const trimmedUsername = username.trim();

    if (!trimmedDisplay) {
      setError('Please enter a display name.');
      return;
    }
    if (!trimmedUsername) {
      setError('Please enter a username.');
      return;
    }
    if (trimmedUsername.length < 3) {
      setError('Username must be at least 3 characters.');
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(trimmedUsername)) {
      setError('Username can only contain letters, numbers, and underscores.');
      return;
    }

    try {
      await saveProfile.mutateAsync({ username: trimmedUsername, displayName: trimmedDisplay });
      onComplete?.();
    } catch (err: any) {
      const msg = err?.message ?? '';
      if (msg.includes('Actor not initialised') || msg.includes('actor')) {
        setError('Still connecting to the network. Please wait a moment and try again.');
      } else {
        setError(msg || 'Failed to save profile. Please try again.');
      }
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-2">
          <img src="/assets/generated/chat-logo.dim_256x256.png" alt="Friends Chat" className="w-8 h-8 rounded-lg" />
          <span className="font-bold text-lg text-foreground">Friends Chat</span>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-lg p-8">
          <div className="flex flex-col items-center mb-6">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-3">
              <User className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Set up your profile</h1>
            <p className="text-muted-foreground text-sm mt-1 text-center">
              Choose a username and display name to get started.
            </p>
          </div>

          {!actorReady && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted rounded-lg px-3 py-2 mb-4">
              <Loader2 className="w-4 h-4 animate-spin shrink-0" />
              <span>Connecting to the network…</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1" htmlFor="username">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. alice_42"
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
                disabled={saveProfile.isPending}
                autoComplete="off"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1" htmlFor="displayName">
                Display Name
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Alice"
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
                disabled={saveProfile.isPending}
                autoComplete="off"
              />
            </div>

            {error && (
              <p className="text-destructive text-sm bg-destructive/10 rounded-lg px-3 py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={!actorReady || saveProfile.isPending}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60"
            >
              {saveProfile.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving…
                </>
              ) : !actorReady ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Connecting…
                </>
              ) : (
                'Save Profile'
              )}
            </button>
          </form>
        </div>
      </main>

      <footer className="border-t border-border py-3 text-center text-xs text-muted-foreground">
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
