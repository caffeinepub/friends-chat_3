import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface MessageThread {
    participants: Array<Principal>;
    messages: Array<Message>;
}
export interface Message {
    content: string;
    sender: string;
    timestamp: Time;
}
export type Time = bigint;
export interface FriendRequest {
    to: Principal;
    from: Principal;
    timestamp: Time;
}
export interface UserProfile {
    principal: Principal;
    username: string;
    displayName: string;
    isOnline: boolean;
    lastOnline: Time;
    friends: Array<Principal>;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    acceptFriendRequest(fromUser: Principal): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createUserProfile(username: string, displayName: string): Promise<void>;
    declineFriendRequest(fromUser: Principal): Promise<void>;
    getAllOnlineUsers(): Promise<Array<UserProfile>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getFriendsList(): Promise<Array<Principal>>;
    getMessages(): Promise<Array<Message>>;
    getOnlineFriends(): Promise<Array<Principal>>;
    getPendingFriendRequests(): Promise<Array<FriendRequest>>;
    getPrivateThread(threadId: Principal): Promise<MessageThread | null>;
    getThreadMessages(threadId: Principal): Promise<Array<Message>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    postMessage(sender: string, content: string): Promise<void>;
    saveCallerUserProfile(username: string, displayName: string): Promise<void>;
    searchUsersByUsername(username: string): Promise<Array<UserProfile>>;
    sendFriendRequest(toUser: Principal): Promise<void>;
    sendMessageToThread(threadId: Principal, content: string): Promise<void>;
    sendPrivateMessage(threadId: Principal, content: string): Promise<void>;
    startPrivateThread(recipient: Principal): Promise<void>;
    updateOnlineStatus(isOnline: boolean): Promise<void>;
}
