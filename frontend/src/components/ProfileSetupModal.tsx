import React, { useState } from 'react';
import { useCreateUserProfile } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ProfileSetupModalProps {
  onComplete: () => void;
}

export default function ProfileSetupModal({ onComplete }: ProfileSetupModalProps) {
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');

  const createProfile = useCreateUserProfile();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedUsername = username.trim().toLowerCase().replace(/\s+/g, '_');
    const trimmedDisplayName = displayName.trim();

    if (!trimmedUsername || trimmedUsername.length < 3) {
      setError('Username must be at least 3 characters.');
      return;
    }
    if (!trimmedDisplayName || trimmedDisplayName.length < 2) {
      setError('Display name must be at least 2 characters.');
      return;
    }

    try {
      await createProfile.mutateAsync({
        username: trimmedUsername,
        displayName: trimmedDisplayName,
      });
      onComplete();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes('already exists')) {
        setError('Username already taken. Please choose another.');
      } else {
        setError('Failed to create profile. Please try again.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl shadow-xl p-8 w-full max-w-sm mx-4">
        <div className="text-center mb-6">
          <img
            src="/assets/generated/friends-chat-icon.dim_512x512.png"
            alt="Friends Chat"
            className="w-16 h-16 mx-auto mb-3 rounded-2xl shadow"
          />
          <h2 className="text-2xl font-bold text-foreground">Set Up Your Profile</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Choose a username and display name to get started.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="Your name"
              disabled={createProfile.isPending}
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="e.g. john_doe"
              disabled={createProfile.isPending}
            />
            <p className="text-xs text-muted-foreground">
              Lowercase letters, numbers, and underscores only.
            </p>
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={createProfile.isPending || !username.trim() || !displayName.trim()}
          >
            {createProfile.isPending ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Creating profile…
              </span>
            ) : (
              'Create Profile'
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
