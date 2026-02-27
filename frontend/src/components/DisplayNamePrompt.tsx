import React, { useState } from 'react';
import { useCreateUserProfile } from '../hooks/useQueries';
import { Loader2, User } from 'lucide-react';

interface DisplayNamePromptProps {
  onComplete: () => void;
}

export default function DisplayNamePrompt({ onComplete }: DisplayNamePromptProps) {
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const createProfile = useCreateUserProfile();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = displayName.trim();
    if (!trimmed) {
      setError('Please enter a display name');
      return;
    }
    if (trimmed.length < 2) {
      setError('Name must be at least 2 characters');
      return;
    }

    const username = trimmed.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');

    try {
      await createProfile.mutateAsync({ username, displayName: trimmed });
      onComplete();
    } catch (err: any) {
      setError(err?.message || 'Failed to create profile. Please try again.');
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="bg-card rounded-2xl shadow-lg border border-border p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <User className="w-7 h-7 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Welcome!</h2>
          <p className="text-sm text-muted-foreground">Choose a display name to get started</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => {
                setDisplayName(e.target.value);
                setError('');
              }}
              placeholder="e.g. Alex Johnson"
              maxLength={30}
              autoFocus
              className="w-full px-4 py-2.5 text-sm bg-muted rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>

          <button
            type="submit"
            disabled={!displayName.trim() || createProfile.isPending}
            className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {createProfile.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating…
              </>
            ) : (
              'Get Started'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
