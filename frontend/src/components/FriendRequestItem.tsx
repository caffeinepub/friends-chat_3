import React from 'react';
import { FriendRequest, UserProfile } from '../backend';
import { useAcceptFriendRequest, useDeclineFriendRequest } from '../hooks/useQueries';
import { Check, X, Loader2 } from 'lucide-react';

interface FriendRequestItemProps {
  request: FriendRequest;
  requesterProfile: UserProfile;
  currentUserProfile: UserProfile;
}

export default function FriendRequestItem({
  request,
  requesterProfile,
}: FriendRequestItemProps) {
  const acceptRequest = useAcceptFriendRequest();
  const declineRequest = useDeclineFriendRequest();

  const initials = requesterProfile.displayName.charAt(0).toUpperCase();

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-colors">
      {/* Avatar */}
      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
        {initials}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{requesterProfile.displayName}</p>
        <p className="text-xs text-muted-foreground truncate">@{requesterProfile.username}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button
          onClick={() => acceptRequest.mutate(request.from)}
          disabled={acceptRequest.isPending || declineRequest.isPending}
          className="w-8 h-8 flex items-center justify-center bg-primary text-primary-foreground rounded-full hover:opacity-90 transition-opacity disabled:opacity-50"
          title="Accept"
        >
          {acceptRequest.isPending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Check className="w-3.5 h-3.5" />
          )}
        </button>
        <button
          onClick={() => declineRequest.mutate(request.from)}
          disabled={acceptRequest.isPending || declineRequest.isPending}
          className="w-8 h-8 flex items-center justify-center bg-muted text-muted-foreground rounded-full hover:bg-destructive hover:text-destructive-foreground transition-colors disabled:opacity-50"
          title="Decline"
        >
          {declineRequest.isPending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <X className="w-3.5 h-3.5" />
          )}
        </button>
      </div>
    </div>
  );
}
