import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { UserProfile, FriendRequest, Message, MessageThread } from '../backend';
import { Principal } from '@dfinity/principal';

// ── User Profile ─────────────────────────────────────────────────────────────

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

export function useCreateUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ username, displayName }: { username: string; displayName: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createUserProfile(username, displayName);
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
      return actor.saveCallerUserProfile(username, displayName);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
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
      if (!actor) throw new Error('Actor not available');
      return actor.postMessage(sender, content);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
  });
}

// ── Friends ───────────────────────────────────────────────────────────────────

export function usePendingFriendRequests() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<FriendRequest[]>({
    queryKey: ['pendingFriendRequests'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getPendingFriendRequests();
    },
    enabled: !!actor && !actorFetching,
    refetchInterval: 10000,
  });
}

export function useSendFriendRequest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (toUser: Principal) => {
      if (!actor) throw new Error('Actor not available');
      return actor.sendFriendRequest(toUser);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingFriendRequests'] });
    },
  });
}

export function useAcceptFriendRequest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (fromUser: Principal) => {
      if (!actor) throw new Error('Actor not available');
      return actor.acceptFriendRequest(fromUser);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingFriendRequests'] });
      queryClient.invalidateQueries({ queryKey: ['friendsList'] });
      queryClient.invalidateQueries({ queryKey: ['friendsProfiles'] });
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useDeclineFriendRequest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (fromUser: Principal) => {
      if (!actor) throw new Error('Actor not available');
      return actor.declineFriendRequest(fromUser);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingFriendRequests'] });
    },
  });
}

export function useFriendsList() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Principal[]>({
    queryKey: ['friendsList'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getFriendsList();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useFriendsProfiles() {
  const { actor, isFetching: actorFetching } = useActor();
  const { data: friendsList = [] } = useFriendsList();

  return useQuery<UserProfile[]>({
    queryKey: ['friendsProfiles', friendsList.map((p) => p.toString()).join(',')],
    queryFn: async () => {
      if (!actor || friendsList.length === 0) return [];
      const profiles = await Promise.all(
        friendsList.map((principal) => actor.getUserProfile(principal))
      );
      return profiles.filter((p): p is UserProfile => p !== null);
    },
    enabled: !!actor && !actorFetching,
    refetchInterval: 15000,
  });
}

export function useSearchUsers(query: string) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<UserProfile[]>({
    queryKey: ['searchUsers', query],
    queryFn: async () => {
      if (!actor || !query) return [];
      return actor.searchUsersByUsername(query);
    },
    enabled: !!actor && !actorFetching && query.length > 0,
  });
}

// ── Private Threads ───────────────────────────────────────────────────────────

export function usePrivateThread(friendPrincipal: Principal | null) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<MessageThread | null>({
    queryKey: ['privateThread', friendPrincipal?.toString()],
    queryFn: async () => {
      if (!actor || !friendPrincipal) return null;
      try {
        return await actor.getPrivateThread(friendPrincipal);
      } catch {
        // Thread may not exist yet
        return null;
      }
    },
    enabled: !!actor && !actorFetching && !!friendPrincipal,
    refetchInterval: 3000,
  });
}

export function useSendPrivateMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ threadId, content }: { threadId: Principal; content: string }) => {
      if (!actor) throw new Error('Actor not available');
      // Try to send; if thread doesn't exist, start it first
      try {
        return await actor.sendPrivateMessage(threadId, content);
      } catch (err: any) {
        if (err?.message?.includes('Thread not found')) {
          await actor.startPrivateThread(threadId);
          return await actor.sendPrivateMessage(threadId, content);
        }
        throw err;
      }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['privateThread', variables.threadId.toString()] });
    },
  });
}
