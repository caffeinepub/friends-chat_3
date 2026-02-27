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
      const result = await actor.getCallerUserProfile();
      return result ?? null;
    },
    enabled: !!actor && !actorFetching,
    retry: false,
    staleTime: 30000,
  });

  // Return custom state that properly reflects actor dependency
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
    refetchInterval: 15000,
  });
}

export function useFriendsProfiles() {
  const { actor, isFetching: actorFetching } = useActor();
  const friendsQuery = useFriendsList();

  return useQuery<UserProfile[]>({
    queryKey: ['friendsProfiles', friendsQuery.data?.map((p) => p.toString())],
    queryFn: async () => {
      if (!actor || !friendsQuery.data) return [];
      const profiles = await Promise.all(
        friendsQuery.data.map((principal) => actor.getUserProfile(principal))
      );
      return profiles.filter((p): p is UserProfile => p !== null);
    },
    enabled: !!actor && !actorFetching && !!friendsQuery.data,
    refetchInterval: 15000,
  });
}

export function useSearchUsers(query: string) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<UserProfile[]>({
    queryKey: ['searchUsers', query],
    queryFn: async () => {
      if (!actor || !query.trim()) return [];
      return actor.searchUsersByUsername(query.trim());
    },
    enabled: !!actor && !actorFetching && query.trim().length > 0,
  });
}

// ── Private Threads ───────────────────────────────────────────────────────────

export function useGetPrivateThread(threadId: Principal | null) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<MessageThread | null>({
    queryKey: ['privateThread', threadId?.toString()],
    queryFn: async () => {
      if (!actor || !threadId) return null;
      return actor.getPrivateThread(threadId);
    },
    enabled: !!actor && !actorFetching && !!threadId,
    refetchInterval: 5000,
  });
}

export function useSendPrivateMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      threadId,
      content,
      autoStart,
    }: {
      threadId: Principal;
      content: string;
      autoStart?: boolean;
    }) => {
      if (!actor) throw new Error('Actor not available');

      if (autoStart) {
        // Try to start the thread first; ignore error if it already exists
        try {
          await actor.startPrivateThread(threadId);
        } catch {
          // Thread may already exist — continue
        }
      }

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
      if (!actor) throw new Error('Actor not available');
      return actor.startPrivateThread(recipient);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['privateThread'] });
    },
  });
}
