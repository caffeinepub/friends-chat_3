import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import type { UserProfile, FriendRequest, Message, MessageThread } from '../backend';
import type { Principal } from '@dfinity/principal';

// ── Profile ──────────────────────────────────────────────────────────────────

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching && !!identity,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useGetUserProfile(principal: Principal | null) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<UserProfile | null>({
    queryKey: ['userProfile', principal?.toString()],
    queryFn: async () => {
      if (!actor || !principal) return null;
      return actor.getUserProfile(principal);
    },
    enabled: !!actor && !actorFetching && !!principal,
  });
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ username, displayName }: { username: string; displayName: string }) => {
      if (!actor) throw new Error('Actor not initialised — please wait a moment and try again.');
      return actor.saveCallerUserProfile(username, displayName);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useCreateUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ username, displayName }: { username: string; displayName: string }) => {
      if (!actor) throw new Error('Actor not initialised — please wait a moment and try again.');
      return actor.createUserProfile(username, displayName);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useUpdateOnlineStatus() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (isOnline: boolean) => {
      if (!actor) throw new Error('Actor not initialised — please wait a moment and try again.');
      return actor.updateOnlineStatus(isOnline);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

// ── Messages ─────────────────────────────────────────────────────────────────

export function useGetMessages() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Message[]>({
    queryKey: ['messages'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMessages();
    },
    enabled: !!actor && !actorFetching,
    refetchInterval: 5000,
  });
}

export function usePostMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sender, content }: { sender: string; content: string }) => {
      if (!actor) throw new Error('Actor not initialised — please wait a moment and try again.');
      return actor.postMessage(sender, content);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
  });
}

// ── Friends ───────────────────────────────────────────────────────────────────

export function useGetFriendsList() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<Principal[]>({
    queryKey: ['friendsList'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getFriendsList();
    },
    enabled: !!actor && !actorFetching && !!identity,
  });
}

export function useGetPendingFriendRequests() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<FriendRequest[]>({
    queryKey: ['pendingFriendRequests'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getPendingFriendRequests();
    },
    enabled: !!actor && !actorFetching && !!identity,
    refetchInterval: 10000,
  });
}

// Alias for backwards compatibility with FriendsPanel
export const usePendingFriendRequests = useGetPendingFriendRequests;

export function useFriendsProfiles() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();
  const friendsQuery = useGetFriendsList();

  return useQuery<UserProfile[]>({
    queryKey: ['friendsProfiles', friendsQuery.data?.map((p) => p.toString())],
    queryFn: async () => {
      if (!actor || !friendsQuery.data) return [];
      const profiles = await Promise.all(
        friendsQuery.data.map((principal) => actor.getUserProfile(principal))
      );
      return profiles.filter((p): p is UserProfile => p !== null);
    },
    enabled: !!actor && !actorFetching && !!identity && !!friendsQuery.data,
    refetchInterval: 15000,
  });
}

export function useSendFriendRequest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (toUser: Principal) => {
      if (!actor) throw new Error('Actor not initialised — please wait a moment and try again.');
      return actor.sendFriendRequest(toUser);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friendsList'] });
      queryClient.invalidateQueries({ queryKey: ['friendsProfiles'] });
      queryClient.invalidateQueries({ queryKey: ['pendingFriendRequests'] });
    },
  });
}

export function useAcceptFriendRequest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (fromUser: Principal) => {
      if (!actor) throw new Error('Actor not initialised — please wait a moment and try again.');
      return actor.acceptFriendRequest(fromUser);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friendsList'] });
      queryClient.invalidateQueries({ queryKey: ['friendsProfiles'] });
      queryClient.invalidateQueries({ queryKey: ['pendingFriendRequests'] });
    },
  });
}

export function useDeclineFriendRequest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (fromUser: Principal) => {
      if (!actor) throw new Error('Actor not initialised — please wait a moment and try again.');
      return actor.declineFriendRequest(fromUser);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingFriendRequests'] });
    },
  });
}

export function useGetOnlineFriends() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<Principal[]>({
    queryKey: ['onlineFriends'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getOnlineFriends();
    },
    enabled: !!actor && !actorFetching && !!identity,
    refetchInterval: 15000,
  });
}

export function useSearchUsers(username: string) {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<UserProfile[]>({
    queryKey: ['searchUsers', username],
    queryFn: async () => {
      if (!actor || !username.trim()) return [];
      return actor.searchUsersByUsername(username);
    },
    enabled: !!actor && !actorFetching && !!identity && username.trim().length > 0,
  });
}

export function useGetAllOnlineUsers() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<UserProfile[]>({
    queryKey: ['allOnlineUsers'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllOnlineUsers();
    },
    enabled: !!actor && !actorFetching && !!identity,
    refetchInterval: 15000,
  });
}

// ── Private threads ───────────────────────────────────────────────────────────

export function useGetPrivateThread(threadId: Principal | null) {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<MessageThread | null>({
    queryKey: ['privateThread', threadId?.toString()],
    queryFn: async () => {
      if (!actor || !threadId) return null;
      return actor.getPrivateThread(threadId);
    },
    enabled: !!actor && !actorFetching && !!identity && !!threadId,
    refetchInterval: 5000,
  });
}

export function useSendPrivateMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ threadId, content }: { threadId: Principal; content: string }) => {
      if (!actor) throw new Error('Actor not initialised — please wait a moment and try again.');
      return actor.sendPrivateMessage(threadId, content);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['privateThread', variables.threadId.toString()] });
    },
  });
}

export function useStartPrivateThread() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (recipient: Principal) => {
      if (!actor) throw new Error('Actor not initialised — please wait a moment and try again.');
      return actor.startPrivateThread(recipient);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['privateThread'] });
    },
  });
}
