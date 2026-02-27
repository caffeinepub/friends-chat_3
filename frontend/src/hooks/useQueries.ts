import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { Principal } from '@dfinity/principal';
import type { UserProfile, Message, FriendRequest, MessageThread } from '../backend';

// ── Caller profile (authorization-component pattern) ─────────────────────────

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

// ── Create / save profile ─────────────────────────────────────────────────────

export function useCreateUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ username, displayName }: { username: string; displayName: string }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.createUserProfile(username, displayName);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ username, displayName }: { username: string; displayName: string }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.saveCallerUserProfile(username, displayName);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

// ── Public messages ───────────────────────────────────────────────────────────

export function useMessages() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Message[]>({
    queryKey: ['messages'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMessages();
    },
    enabled: !!actor && !actorFetching,
    refetchInterval: 3000,
  });
}

export function usePostMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sender, content }: { sender: string; content: string }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.postMessage(sender, content);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
    onError: (error) => {
      console.error('Failed to post message:', error);
    },
  });
}

// ── User profile lookup ───────────────────────────────────────────────────────

export function useGetUserProfile(principal: Principal | null) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<UserProfile | null>({
    queryKey: ['userProfile', principal?.toString()],
    queryFn: async () => {
      if (!actor || !principal) return null;
      return actor.getUserProfile(principal);
    },
    enabled: !!actor && !actorFetching && !!principal,
    retry: false,
  });
}

// ── Search users ──────────────────────────────────────────────────────────────

export function useSearchUsers(query: string) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<UserProfile[]>({
    queryKey: ['searchUsers', query],
    queryFn: async () => {
      if (!actor || !query.trim()) return [];
      return actor.searchUsersByUsername(query.trim());
    },
    enabled: !!actor && !actorFetching && query.trim().length > 0,
    retry: false,
  });
}

// ── Friends list ──────────────────────────────────────────────────────────────

export function useFriendsList() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Principal[]>({
    queryKey: ['friendsList'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getFriendsList();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });
}

export function useFriendsProfiles() {
  const { actor, isFetching: actorFetching } = useActor();
  const { data: friendsList } = useFriendsList();

  return useQuery<UserProfile[]>({
    queryKey: ['friendsProfiles', friendsList?.map(p => p.toString()).join(',')],
    queryFn: async () => {
      if (!actor || !friendsList || friendsList.length === 0) return [];
      const profiles = await Promise.all(
        friendsList.map(p => actor.getUserProfile(p))
      );
      return profiles.filter((p): p is UserProfile => p !== null);
    },
    enabled: !!actor && !actorFetching && !!friendsList,
    retry: false,
  });
}

// ── Friend requests ───────────────────────────────────────────────────────────

export function usePendingFriendRequests() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<FriendRequest[]>({
    queryKey: ['pendingFriendRequests'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getPendingFriendRequests();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
    refetchInterval: 10000,
  });
}

export function useSendFriendRequest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (toUser: Principal) => {
      if (!actor) throw new Error('Actor not available');
      await actor.sendFriendRequest(toUser);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingFriendRequests'] });
      queryClient.invalidateQueries({ queryKey: ['searchUsers'] });
      queryClient.invalidateQueries({ queryKey: ['friendsList'] });
    },
    onError: (error) => {
      console.error('Failed to send friend request:', error);
    },
  });
}

export function useAcceptFriendRequest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (fromUser: Principal) => {
      if (!actor) throw new Error('Actor not available');
      await actor.acceptFriendRequest(fromUser);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingFriendRequests'] });
      queryClient.invalidateQueries({ queryKey: ['friendsList'] });
      queryClient.invalidateQueries({ queryKey: ['friendsProfiles'] });
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
    onError: (error) => {
      console.error('Failed to accept friend request:', error);
    },
  });
}

export function useDeclineFriendRequest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (fromUser: Principal) => {
      if (!actor) throw new Error('Actor not available');
      await actor.declineFriendRequest(fromUser);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingFriendRequests'] });
    },
    onError: (error) => {
      console.error('Failed to decline friend request:', error);
    },
  });
}

// ── Private threads ───────────────────────────────────────────────────────────

export function usePrivateThread(friendPrincipal: Principal | null) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<MessageThread | null>({
    queryKey: ['privateThread', friendPrincipal?.toString()],
    queryFn: async () => {
      if (!actor || !friendPrincipal) return null;
      try {
        return await actor.getPrivateThread(friendPrincipal);
      } catch {
        return null;
      }
    },
    enabled: !!actor && !actorFetching && !!friendPrincipal,
    retry: false,
    refetchInterval: 3000,
  });
}

export function useStartPrivateThread() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (recipient: Principal) => {
      if (!actor) throw new Error('Actor not available');
      await actor.startPrivateThread(recipient);
    },
    onSuccess: (_data, recipient) => {
      queryClient.invalidateQueries({ queryKey: ['privateThread', recipient.toString()] });
    },
    onError: (error) => {
      console.error('Failed to start private thread:', error);
    },
  });
}

export function useSendPrivateMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ threadId, content }: { threadId: Principal; content: string }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.sendPrivateMessage(threadId, content);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['privateThread', variables.threadId.toString()] });
    },
    onError: (error) => {
      console.error('Failed to send private message:', error);
    },
  });
}

// ── Online status ─────────────────────────────────────────────────────────────

export function useUpdateOnlineStatus() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (isOnline: boolean) => {
      if (!actor) throw new Error('Actor not available');
      await actor.updateOnlineStatus(isOnline);
    },
    onError: (error) => {
      console.error('Failed to update online status:', error);
    },
  });
}
