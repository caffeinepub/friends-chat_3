import React, { useState } from 'react';
import { UserProfile, FriendRequest } from '../backend';
import {
  useSearchUsers,
  useSendFriendRequest,
  useGetPendingFriendRequests,
  useFriendsProfiles,
  useAcceptFriendRequest,
  useDeclineFriendRequest,
  useGetUserProfile,
} from '../hooks/useQueries';
import FriendListItem from './FriendListItem';
import FriendRequestItem from './FriendRequestItem';
import { Search, UserPlus, Users, Bell, Loader2 } from 'lucide-react';

interface FriendsPanelProps {
  currentUserProfile: UserProfile;
  onSelectFriend: (friend: UserProfile) => void;
  selectedFriend: UserProfile | null;
  onStartVideoCall: (friend: UserProfile) => void;
}

// Sub-component: looks up a requester's profile then renders FriendRequestItem
function PendingRequestRow({
  request,
  currentUserProfile,
}: {
  request: FriendRequest;
  currentUserProfile: UserProfile;
}) {
  const { data: requesterProfile, isLoading } = useGetUserProfile(request.from);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2">
        <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
        <div className="flex-1 h-4 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  if (!requesterProfile) return null;

  return (
    <FriendRequestItem
      request={request}
      requesterProfile={requesterProfile}
      currentUserProfile={currentUserProfile}
    />
  );
}

export default function FriendsPanel({
  currentUserProfile,
  onSelectFriend,
  selectedFriend,
  onStartVideoCall,
}: FriendsPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState<'friends' | 'requests' | 'search'>('friends');

  const { data: searchResults = [], isLoading: isSearching } = useSearchUsers(
    searchQuery.trim().length >= 1 ? searchQuery.trim() : ''
  );
  const { data: pendingRequests = [] } = useGetPendingFriendRequests();
  const { data: friendsProfiles = [], isLoading: friendsLoading } = useFriendsProfiles();
  const sendFriendRequest = useSendFriendRequest();

  const filteredSearch = searchResults.filter(
    (u) => u.principal.toString() !== currentUserProfile.principal.toString()
  );

  const isFriend = (profile: UserProfile) =>
    currentUserProfile.friends.some((f) => f.toString() === profile.principal.toString());

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Panel header */}
      <div className="px-4 pt-4 pb-2 flex-shrink-0">
        <h2 className="text-base font-bold text-foreground mb-3">Friends</h2>

        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search users…"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (e.target.value.trim()) setActiveSection('search');
              else setActiveSection('friends');
            }}
            className="w-full pl-9 pr-3 py-2 text-sm bg-muted rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
          />
          {isSearching && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />
          )}
        </div>

        {/* Section tabs */}
        {!searchQuery.trim() && (
          <div className="flex gap-1 mt-3">
            <button
              onClick={() => setActiveSection('friends')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeSection === 'friends'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Friends
              {friendsProfiles.length > 0 && (
                <span className="ml-0.5 bg-primary-foreground/20 text-primary-foreground rounded-full px-1.5 py-0.5 text-xs leading-none">
                  {friendsProfiles.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveSection('requests')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeSection === 'requests'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              <Bell className="w-3.5 h-3.5" />
              Requests
              {pendingRequests.length > 0 && (
                <span className="ml-0.5 bg-destructive text-destructive-foreground rounded-full px-1.5 py-0.5 text-xs leading-none">
                  {pendingRequests.length}
                </span>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-2 pb-4">
        {/* Search results */}
        {searchQuery.trim() && (
          <div className="space-y-1 mt-1">
            {filteredSearch.length === 0 && !isSearching && (
              <p className="text-center text-sm text-muted-foreground py-6">No users found</p>
            )}
            {filteredSearch.map((user) => {
              const alreadyFriend = isFriend(user);
              const isPending = sendFriendRequest.isPending;
              return (
                <div
                  key={user.principal.toString()}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
                    {user.displayName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{user.displayName}</p>
                    <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
                  </div>
                  {alreadyFriend ? (
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">Friend</span>
                  ) : (
                    <button
                      onClick={() => sendFriendRequest.mutate(user.principal)}
                      disabled={isPending}
                      className="flex items-center gap-1 text-xs bg-primary text-primary-foreground px-2.5 py-1.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      {isPending ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <UserPlus className="w-3 h-3" />
                      )}
                      Add
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Friends list */}
        {!searchQuery.trim() && activeSection === 'friends' && (
          <div className="space-y-1 mt-1">
            {friendsLoading && (
              <div className="space-y-2 mt-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-2">
                    <div className="w-9 h-9 rounded-full bg-muted animate-pulse" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3.5 bg-muted rounded animate-pulse w-3/4" />
                      <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            )}
            {!friendsLoading && friendsProfiles.length === 0 && (
              <div className="text-center py-10 space-y-2">
                <Users className="w-10 h-10 text-muted-foreground/40 mx-auto" />
                <p className="text-sm text-muted-foreground">No friends yet</p>
                <p className="text-xs text-muted-foreground/70">Search for users above to add friends</p>
              </div>
            )}
            {friendsProfiles.map((friend) => (
              <FriendListItem
                key={friend.principal.toString()}
                friend={friend}
                isSelected={selectedFriend?.principal.toString() === friend.principal.toString()}
                onClick={() => onSelectFriend(friend)}
                onStartVideoCall={() => onStartVideoCall(friend)}
              />
            ))}
          </div>
        )}

        {/* Pending requests */}
        {!searchQuery.trim() && activeSection === 'requests' && (
          <div className="space-y-1 mt-1">
            {pendingRequests.length === 0 && (
              <div className="text-center py-10 space-y-2">
                <Bell className="w-10 h-10 text-muted-foreground/40 mx-auto" />
                <p className="text-sm text-muted-foreground">No pending requests</p>
              </div>
            )}
            {pendingRequests.map((req) => (
              <PendingRequestRow
                key={req.from.toString()}
                request={req}
                currentUserProfile={currentUserProfile}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
