import React, { useState } from 'react';
import { useActor } from '../hooks/useActor';
import { useSaveCallerUserProfile } from '../hooks/useQueries';
import { Loader2 } from 'lucide-react';

interface DisplayNamePromptProps {
  onComplete?: () => void;
}

export default function DisplayNamePrompt({ onComplete }: DisplayNamePromptProps) {
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
    const trimmedUsername = username.trim() || displayName.trim().toLowerCase().replace(/\s+/g, '_');

    if (!trimmedDisplay) {
      setError('Please enter a display name.');
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
        setError(msg || 'Failed to save. Please try again.');
      }
    }
  };

  return (
    <div className="bg-card border border-border rounded-2xl shadow-lg p-6 w-full max-w-sm mx-auto">
      <h2 className="text-xl font-bold text-foreground mb-1">Welcome!</h2>
      <p className="text-muted-foreground text-sm mb-4">Enter a display name to get started.</p>

      {!actorReady && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted rounded-lg px-3 py-2 mb-3">
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
          <span>Connecting to the network…</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1" htmlFor="dp-displayName">
            Display Name
          </label>
          <input
            id="dp-displayName"
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
          <p className="text-destructive text-sm">{error}</p>
        )}

        <button
          type="submit"
          disabled={!actorReady || saveProfile.isPending}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60"
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
            'Continue'
          )}
        </button>
      </form>
    </div>
  );
}
