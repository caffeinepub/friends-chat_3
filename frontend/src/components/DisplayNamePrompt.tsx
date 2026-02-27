import { useState, type FormEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { MessageCircle } from 'lucide-react';

interface DisplayNamePromptProps {
  onSubmit: (name: string) => void;
}

export default function DisplayNamePrompt({ onSubmit }: DisplayNamePromptProps) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Please enter a display name.');
      return;
    }
    if (trimmed.length < 2) {
      setError('Name must be at least 2 characters.');
      return;
    }
    if (trimmed.length > 30) {
      setError('Name must be 30 characters or fewer.');
      return;
    }
    onSubmit(trimmed);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-amber/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo & Title */}
        <div className="flex flex-col items-center mb-8 gap-3">
          <div className="relative">
            <img
              src="/assets/generated/chat-logo.dim_256x256.png"
              alt="Friends Chat"
              className="w-20 h-20 rounded-2xl object-cover shadow-lg"
            />
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
              Friends Chat
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              A cozy place to chat with your friends
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl shadow-lg p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">Choose your name</h2>
              <p className="text-xs text-muted-foreground">This is how friends will see you</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="display-name" className="text-sm font-medium">
                Display Name
              </Label>
              <Input
                id="display-name"
                type="text"
                placeholder="e.g. Alex, Jordan, Sam..."
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError('');
                }}
                className="rounded-xl"
                autoFocus
                maxLength={30}
              />
              {error && (
                <p className="text-xs text-destructive mt-0.5">{error}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full rounded-xl font-semibold"
              disabled={!name.trim()}
            >
              Start Chatting →
            </Button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          Built with{' '}
          <span className="text-coral-500" aria-label="love">♥</span>{' '}
          using{' '}
          <a
            href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname || 'unknown-app')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary hover:underline"
          >
            caffeine.ai
          </a>{' '}
          &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
