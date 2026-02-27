import Map "mo:core/Map";
import List "mo:core/List";
import Principal "mo:core/Principal";
import Time "mo:core/Time";

import AccessControl "authorization/access-control";

module {
  type Message = {
    sender : Text;
    content : Text;
    timestamp : Time.Time;
  };

  type UserProfile = {
    principal : Principal;
    username : Text;
    displayName : Text;
    lastOnline : Time.Time;
    isOnline : Bool;
    friends : [Principal];
  };

  type FriendRequest = {
    from : Principal;
    to : Principal;
    timestamp : Time.Time;
  };

  type MessageThread = {
    participants : [Principal];
    messages : [Message];
  };

  type OldActor = {
    messagesList : List.List<Message>;
    userProfiles : Map.Map<Principal, UserProfile>;
    friendRequests : Map.Map<Principal, FriendRequest>;
    messageThreads : Map.Map<Principal, MessageThread>;
    accessControlState : AccessControl.AccessControlState;
  };

  type NewActor = {
    messagesList : List.List<Message>;
    userProfiles : Map.Map<Principal, UserProfile>;
    friendRequests : Map.Map<Principal, FriendRequest>;
    messageThreads : Map.Map<Principal, MessageThread>;
    accessControlState : AccessControl.AccessControlState;
  };

  public func run(old : OldActor) : NewActor {
    old;
  };
};
