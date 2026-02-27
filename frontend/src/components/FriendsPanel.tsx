import React, { useState, useCallback } from 'react';
import { Principal } from '@dfinity/principal';
import {
  useSearchUsers,
  useSendFriendRequest,
  usePendingFriendRequests,
  useFriendsProfiles,
  useGetUserProfile,
} from '../hooks/useQueries';
import FriendListItem from './FriendListItem';
import FriendRequestItem from './FriendRequestItem';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { UserPlus, Search, Users, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { UserProfile, FriendRequest } from '../backend';
import { useInternetIdentity } from '../hooks/useInternetIdentity';

interface FriendsPanelProps {
  onSelectFriend: (principal: Principal) => void;
  onVideoCall?: (principal: Principal) => void;
}

// Sub-component to render a single pending request with profile lookup
function PendingRequestRow({
  request,
  onVideoCall,
}: {
  request: FriendRequest;
  onVideoCall?: (principal: Principal) => void;
}) {
  const { data: profile, isLoading } = useGetUserProfile(request.from);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 p-2">
        <Skeleton className="w-8 h-8 rounded-full" />
        <Skeleton className="h-4 w-32" />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <FriendRequestItem
      request={request}
      profile={profile}
      onVideoCall={onVideoCall}
    />
  );
}

export default function FriendsPanel({ onSelectFriend, onVideoCall }: FriendsPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const { identity } = useInternetIdentity();
  const currentPrincipal = identity?.getPrincipal().toString();

  const { data: searchResults, isLoading: searchLoading } = useSearchUsers(searchQuery);
  const { data: pendingRequests, isLoading: requestsLoading } = usePendingFriendRequests();
  const { data: friendsProfiles, isLoading: friendsLoading } = useFriendsProfiles();
  const sendFriendRequest = useSendFriendRequest();

  const handleSendRequest = useCallback(
    async (profile: UserProfile) => {
      try {
        await sendFriendRequest.mutateAsync(profile.principal);
      } catch (error) {
        console.error('Failed to send friend request:', error);
      }
    },
    [sendFriendRequest]
  );

  const filteredSearchResults = (searchResults ?? []).filter(
    p => p.principal.toString() !== currentPrincipal
  );

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-3 border-b border-border">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search users…"
            className="pl-8"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Search results */}
        {searchQuery.trim().length > 0 && (
          <div className="p-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-2 mb-1">
              Search Results
            </p>
            {searchLoading ? (
              <div className="space-y-2 p-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Skeleton className="w-8 h-8 rounded-full" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                ))}
              </div>
            ) : filteredSearchResults.length === 0 ? (
              <p className="text-sm text-muted-foreground px-2 py-3">No users found.</p>
            ) : (
              <div className="space-y-1">
                {filteredSearchResults.map(profile => (
                  <div
                    key={profile.principal.toString()}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-accent/50"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                        {profile.displayName.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{profile.displayName}</p>
                        <p className="text-xs text-muted-foreground truncate">@{profile.username}</p>
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleSendRequest(profile)}
                      disabled={sendFriendRequest.isPending}
                      title="Send friend request"
                      className="flex-shrink-0"
                    >
                      {sendFriendRequest.isPending ? (
                        <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <UserPlus className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Pending friend requests */}
        {!searchQuery.trim() && (
          <div className="p-2">
            <div className="flex items-center gap-1 px-2 mb-1">
              <Bell className="w-3 h-3 text-muted-foreground" />
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Requests {pendingRequests && pendingRequests.length > 0 ? `(${pendingRequests.length})` : ''}
              </p>
            </div>
            {requestsLoading ? (
              <div className="space-y-2 p-2">
                <Skeleton className="h-12 w-full rounded-lg" />
              </div>
            ) : !pendingRequests || pendingRequests.length === 0 ? (
              <p className="text-sm text-muted-foreground px-2 py-2">No pending requests.</p>
            ) : (
              <div className="space-y-1">
                {pendingRequests.map(request => (
                  <PendingRequestRow
                    key={request.from.toString()}
                    request={request}
                    onVideoCall={onVideoCall}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Friends list */}
        {!searchQuery.trim() && (
          <div className="p-2">
            <div className="flex items-center gap-1 px-2 mb-1">
              <Users className="w-3 h-3 text-muted-foreground" />
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Friends {friendsProfiles && friendsProfiles.length > 0 ? `(${friendsProfiles.length})` : ''}
              </p>
            </div>
            {friendsLoading ? (
              <div className="space-y-2 p-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Skeleton className="w-8 h-8 rounded-full" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                ))}
              </div>
            ) : !friendsProfiles || friendsProfiles.length === 0 ? (
              <p className="text-sm text-muted-foreground px-2 py-2">No friends yet. Search for users to add!</p>
            ) : (
              <div className="space-y-1">
                {friendsProfiles.map(profile => (
                  <FriendListItem
                    key={profile.principal.toString()}
                    profile={profile}
                    onClick={() => onSelectFriend(profile.principal)}
                    onVideoCall={onVideoCall ? () => onVideoCall(profile.principal) : undefined}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
