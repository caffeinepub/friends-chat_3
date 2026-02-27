import Time "mo:core/Time";
import List "mo:core/List";

actor {
  type Message = {
    sender : Text;
    content : Text;
    timestamp : Time.Time;
  };

  let messagesList = List.empty<Message>();

  public shared ({ caller }) func postMessage(sender : Text, content : Text) : async () {
    let message : Message = {
      sender;
      content;
      timestamp = Time.now();
    };
    messagesList.add(message);
  };

  public query ({ caller }) func getMessages() : async [Message] {
    messagesList.toArray();
  };
};
