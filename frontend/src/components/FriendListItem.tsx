import React from 'react';
import { Principal } from '@dfinity/principal';
import { Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { UserProfile } from '../backend';

interface FriendListItemProps {
  profile: UserProfile;
  onClick: () => void;
  onVideoCall?: () => void;
}

function isOnline(profile: UserProfile): boolean {
  if (profile.isOnline) return true;
  // Consider online if lastOnline within last 5 minutes
  const fiveMinutesAgo = BigInt(Date.now() - 5 * 60 * 1000) * BigInt(1_000_000);
  return profile.lastOnline > fiveMinutesAgo;
}

export default function FriendListItem({ profile, onClick, onVideoCall }: FriendListItemProps) {
  const online = isOnline(profile);
  const initials = profile.displayName.slice(0, 2).toUpperCase();

  return (
    <div
      className="flex items-center justify-between p-2 rounded-lg hover:bg-accent/50 cursor-pointer group"
      onClick={onClick}
    >
      <div className="flex items-center gap-2 min-w-0">
        {/* Avatar with online indicator */}
        <div className="relative flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
            {initials}
          </div>
          <span
            className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-card ${
              online ? 'bg-green-500' : 'bg-muted-foreground/40'
            }`}
          />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{profile.displayName}</p>
          <p className="text-xs text-muted-foreground truncate">@{profile.username}</p>
        </div>
      </div>
      {onVideoCall && (
        <Button
          size="icon"
          variant="ghost"
          onClick={e => {
            e.stopPropagation();
            onVideoCall();
          }}
          title="Video call"
          className="w-7 h-7 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
        >
          <Video className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}
