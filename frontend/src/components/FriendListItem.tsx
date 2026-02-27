import React from 'react';
import { UserProfile } from '../backend';
import { Video } from 'lucide-react';

interface FriendListItemProps {
  friend: UserProfile;
  isSelected: boolean;
  onClick: () => void;
  onStartVideoCall: () => void;
}

function isRecentlyOnline(lastOnline: bigint): boolean {
  const fiveMinutesAgo = BigInt(Date.now() - 5 * 60 * 1000) * BigInt(1_000_000);
  return lastOnline > fiveMinutesAgo;
}

export default function FriendListItem({
  friend,
  isSelected,
  onClick,
  onStartVideoCall,
}: FriendListItemProps) {
  const online = friend.isOnline || isRecentlyOnline(friend.lastOnline);
  const initials = friend.displayName.charAt(0).toUpperCase();

  return (
    <div
      onClick={onClick}
      className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
        isSelected ? 'bg-primary/10 text-primary' : 'hover:bg-muted/60 text-foreground'
      }`}
    >
      {/* Avatar with online indicator */}
      <div className="relative flex-shrink-0">
        <div
          className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${
            isSelected ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'
          }`}
        >
          {initials}
        </div>
        {online && (
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-card rounded-full" />
        )}
      </div>

      {/* Name + username */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{friend.displayName}</p>
        <p className="text-xs text-muted-foreground truncate">
          {online ? 'Online' : '@' + friend.username}
        </p>
      </div>

      {/* Video call button — always visible, not just on hover */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onStartVideoCall();
        }}
        className={`flex-shrink-0 p-1.5 rounded-lg transition-colors ${
          isSelected
            ? 'text-primary hover:bg-primary/20'
            : 'text-muted-foreground hover:text-primary hover:bg-primary/10 opacity-0 group-hover:opacity-100'
        }`}
        title={`Video call ${friend.displayName}`}
      >
        <Video className="w-4 h-4" />
      </button>
    </div>
  );
}
