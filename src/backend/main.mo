import Array "mo:core/Array";
import Nat "mo:core/Nat";
import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import Order "mo:core/Order";

actor {
  type Message = {
    name : Text;
    email : Text;
    message : Text;
  };

  module Message {
    public func compareByEmail(message1 : Message, message2 : Message) : Order.Order {
      message1.email.compare(message2.email);
    };
  };

  let messages = Map.empty<Nat, Message>();
  var visitorCount = 0;
  var nextId = 0;

  public shared ({ caller }) func submitMessage(name : Text, email : Text, message : Text) : async () {
    if (name.isEmpty() or email.isEmpty() or message.isEmpty()) {
      Runtime.trap("All fields must be filled.");
    };

    let msg : Message = {
      name;
      email;
      message;
    };

    messages.add(nextId, msg);
    nextId += 1;
  };

  public query ({ caller }) func getAllMessages() : async [Message] {
    messages.values().toArray();
  };

  public query ({ caller }) func getAllMessagesByEmail() : async [Message] {
    messages.values().toArray().sort(Message.compareByEmail);
  };

  public shared ({ caller }) func incrementVisitorCount() : async () {
    visitorCount += 1;
  };

  public query ({ caller }) func getVisitorCount() : async Nat {
    visitorCount;
  };
};
