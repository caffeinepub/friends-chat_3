import React from 'react';
import { Principal } from '@dfinity/principal';
import { useAcceptFriendRequest, useDeclineFriendRequest } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';
import type { UserProfile, FriendRequest } from '../backend';

interface FriendRequestItemProps {
  request: FriendRequest;
  profile: UserProfile;
  onVideoCall?: (principal: Principal) => void;
}

export default function FriendRequestItem({ request, profile }: FriendRequestItemProps) {
  const acceptMutation = useAcceptFriendRequest();
  const declineMutation = useDeclineFriendRequest();

  const handleAccept = async () => {
    try {
      await acceptMutation.mutateAsync(request.from);
    } catch (error) {
      console.error('Failed to accept friend request:', error);
    }
  };

  const handleDecline = async () => {
    try {
      await declineMutation.mutateAsync(request.from);
    } catch (error) {
      console.error('Failed to decline friend request:', error);
    }
  };

  const initials = profile.displayName.slice(0, 2).toUpperCase();
  const isPending = acceptMutation.isPending || declineMutation.isPending;

  return (
    <div className="flex items-center justify-between p-2 rounded-lg hover:bg-accent/50">
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-xs font-bold text-amber-600 flex-shrink-0">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{profile.displayName}</p>
          <p className="text-xs text-muted-foreground truncate">@{profile.username}</p>
        </div>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <Button
          size="icon"
          variant="ghost"
          onClick={handleAccept}
          disabled={isPending}
          title="Accept"
          className="w-7 h-7 text-green-600 hover:text-green-700 hover:bg-green-50"
        >
          {acceptMutation.isPending ? (
            <span className="w-3 h-3 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Check className="w-4 h-4" />
          )}
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={handleDecline}
          disabled={isPending}
          title="Decline"
          className="w-7 h-7 text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          {declineMutation.isPending ? (
            <span className="w-3 h-3 border-2 border-destructive border-t-transparent rounded-full animate-spin" />
          ) : (
            <X className="w-4 h-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
