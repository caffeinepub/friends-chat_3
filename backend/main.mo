import Map "mo:core/Map";
import List "mo:core/List";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import Text "mo:core/Text";
import Iter "mo:core/Iter";
import Runtime "mo:core/Runtime";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";



// Use with clause to enable data migration on upgrades.

actor {
  public type Message = {
    sender : Text;
    content : Text;
    timestamp : Time.Time;
  };

  public type UserProfile = {
    principal : Principal;
    username : Text;
    displayName : Text;
    lastOnline : Time.Time;
    isOnline : Bool;
    friends : [Principal];
  };

  public type FriendRequest = {
    from : Principal;
    to : Principal;
    timestamp : Time.Time;
  };

  public type MessageThread = {
    participants : [Principal];
    messages : [Message];
  };

  let messagesList = List.empty<Message>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let friendRequests = Map.empty<Principal, FriendRequest>();
  let messageThreads = Map.empty<Principal, MessageThread>();

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // ── Helper Function ──────────────────────────────────────────────

  func arrayContains(array : [Principal], value : Principal) : Bool {
    for (item in array.values()) {
      if (item == value) {
        return true;
      };
    };
    false;
  };

  // ── Global message board ────────────────────────────────────────────────────

  public shared ({ caller }) func postMessage(sender : Text, content : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can post messages");
    };
    let message : Message = {
      sender;
      content;
      timestamp = Time.now();
    };
    messagesList.add(message);
  };

  // Public chat feed is readable by anyone (including guests)
  public query func getMessages() : async [Message] {
    messagesList.toArray();
  };

  // ── User profile management ─────────────────────────────────────────────────

  public shared ({ caller }) func createUserProfile(username : Text, displayName : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create profiles");
    };
    if (userProfiles.containsKey(caller)) {
      Runtime.trap("User already exists");
    };

    let newProfile : UserProfile = {
      principal = caller;
      username;
      displayName;
      lastOnline = Time.now();
      isOnline = true;
      friends = [];
    };

    userProfiles.add(caller, newProfile);
  };

  // Returns the caller's own profile
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get their profile");
    };
    userProfiles.get(caller);
  };

  // Saves/updates the caller's own profile
  public shared ({ caller }) func saveCallerUserProfile(username : Text, displayName : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save their profile");
    };
    let existing = userProfiles.get(caller);
    let updatedProfile : UserProfile = switch (existing) {
      case (null) {
        {
          principal = caller;
          username;
          displayName;
          lastOnline = Time.now();
          isOnline = true;
          friends = [];
        }
      };
      case (?profile) {
        {
          profile with
          username;
          displayName;
          lastOnline = Time.now();
        }
      };
    };
    userProfiles.add(caller, updatedProfile);
  };

  // Fetch another user's profile; caller must be authenticated user
  // Admins can view any profile; regular users can view any profile (needed for social features/search)
  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func updateOnlineStatus(isOnline : Bool) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update online status");
    };
    switch (userProfiles.get(caller)) {
      case (null) { Runtime.trap("User not found") };
      case (?profile) {
        userProfiles.add(
          caller,
          {
            profile with
            isOnline;
            lastOnline = Time.now();
          },
        );
      };
    };
  };

  // ── Friend requests ─────────────────────────────────────────────────────────

  public shared ({ caller }) func sendFriendRequest(toUser : Principal) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can send friend requests");
    };
    if (caller == toUser) {
      Runtime.trap("Cannot send a friend request to yourself");
    };
    switch (userProfiles.get(caller)) {
      case (null) { Runtime.trap("User not found") };
      case (?_) {
        let request : FriendRequest = {
          from = caller;
          to = toUser;
          timestamp = Time.now();
        };
        friendRequests.add(caller, request);
      };
    };
  };

  public shared ({ caller }) func acceptFriendRequest(fromUser : Principal) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can accept friend requests");
    };
    switch (friendRequests.get(fromUser)) {
      case (null) { Runtime.trap("Friend request not found") };
      case (?request) {
        if (request.to != caller) {
          Runtime.trap("Not authorized to accept this request");
        };

        switch (userProfiles.get(caller), userProfiles.get(fromUser)) {
          case (?toProfile, ?fromProfile) {
            let toFriends = toProfile.friends.concat([fromUser]);
            let fromFriends = fromProfile.friends.concat([caller]);

            userProfiles.add(caller, { toProfile with friends = toFriends });
            userProfiles.add(fromUser, { fromProfile with friends = fromFriends });
          };
          case (_) { Runtime.trap("One or both users not found") };
        };

        friendRequests.remove(fromUser);
      };
    };
  };

  public shared ({ caller }) func declineFriendRequest(fromUser : Principal) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can decline friend requests");
    };
    switch (friendRequests.get(fromUser)) {
      case (null) { Runtime.trap("Friend request not found") };
      case (?request) {
        if (request.to != caller) {
          Runtime.trap("Not authorized to decline this request");
        };
        friendRequests.remove(fromUser);
      };
    };
  };

  public query ({ caller }) func getPendingFriendRequests() : async [FriendRequest] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view friend requests");
    };
    let pending = friendRequests.values().toArray().filter(
      func(req : FriendRequest) : Bool {
        req.to == caller;
      }
    );
    pending;
  };

  public query ({ caller }) func getFriendsList() : async [Principal] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view their friends list");
    };
    switch (userProfiles.get(caller)) {
      case (null) { Runtime.trap("User not found") };
      case (?profile) { profile.friends };
    };
  };

  public query ({ caller }) func getOnlineFriends() : async [Principal] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view online friends");
    };
    switch (userProfiles.get(caller)) {
      case (null) { Runtime.trap("User not found") };
      case (?profile) {
        let onlineFriends = profile.friends.filter(
          func(friend : Principal) : Bool {
            switch (userProfiles.get(friend)) {
              case (null) { false };
              case (?friendProfile) { friendProfile.isOnline };
            };
          }
        );
        onlineFriends;
      };
    };
  };

  // ── Private message threads ─────────────────────────────────────────────────

  public shared ({ caller }) func startPrivateThread(recipient : Principal) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can start private threads");
    };
    switch (userProfiles.get(caller), userProfiles.get(recipient)) {
      case (?callerProfile, ?_recipientProfile) {
        if (not arrayContains(callerProfile.friends, recipient)) {
          Runtime.trap("Not friends with recipient");
        };

        let thread : MessageThread = {
          participants = [caller, recipient];
          messages = [];
        };

        messageThreads.add(caller, thread);
        messageThreads.add(recipient, thread);
      };
      case (_) { Runtime.trap("One or both users not found") };
    };
  };

  public shared ({ caller }) func sendMessageToThread(threadId : Principal, content : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can send messages");
    };
    switch (messageThreads.get(threadId)) {
      case (null) { Runtime.trap("Thread not found") };
      case (?thread) {
        if (not arrayContains(thread.participants, caller)) {
          Runtime.trap("Not a participant of this thread");
        };

        let message : Message = {
          sender = caller.toText();
          content;
          timestamp = Time.now();
        };

        let updatedMessages = thread.messages.concat([message]);
        let updatedThread = {
          thread with
          messages = updatedMessages;
        };

        for (participant in thread.participants.values()) {
          messageThreads.add(participant, updatedThread);
        };
      };
    };
  };

  // Alias matching the implementation plan's function name
  public shared ({ caller }) func sendPrivateMessage(threadId : Principal, content : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can send private messages");
    };
    switch (messageThreads.get(threadId)) {
      case (null) { Runtime.trap("Thread not found") };
      case (?thread) {
        if (not arrayContains(thread.participants, caller)) {
          Runtime.trap("Not a participant of this thread");
        };

        let message : Message = {
          sender = caller.toText();
          content;
          timestamp = Time.now();
        };

        let updatedMessages = thread.messages.concat([message]);
        let updatedThread = {
          thread with
          messages = updatedMessages;
        };

        for (participant in thread.participants.values()) {
          messageThreads.add(participant, updatedThread);
        };
      };
    };
  };

  public query ({ caller }) func getThreadMessages(threadId : Principal) : async [Message] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can read thread messages");
    };
    switch (messageThreads.get(threadId)) {
      case (null) { Runtime.trap("Thread not found") };
      case (?thread) {
        if (not arrayContains(thread.participants, caller)) {
          Runtime.trap("Not a participant of this thread");
        };
        thread.messages;
      };
    };
  };

  // Alias matching the implementation plan's function name
  public query ({ caller }) func getPrivateThread(threadId : Principal) : async ?MessageThread {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can read private threads");
    };
    switch (messageThreads.get(threadId)) {
      case (null) { null };
      case (?thread) {
        if (not arrayContains(thread.participants, caller)) {
          Runtime.trap("Not a participant of this thread");
        };
        ?thread;
      };
    };
  };

  // ── Discovery ───────────────────────────────────────────────────────────────

  public query ({ caller }) func searchUsersByUsername(username : Text) : async [UserProfile] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can search for other users");
    };
    let filtered = userProfiles.values().toArray().filter(
      func(profile : UserProfile) : Bool {
        profile.username.contains(#text username);
      }
    );
    filtered;
  };

  public query ({ caller }) func getAllOnlineUsers() : async [UserProfile] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view online users");
    };
    let filtered = userProfiles.values().toArray().filter(
      func(profile : UserProfile) : Bool {
        profile.isOnline;
      }
    );
    filtered;
  };
};
