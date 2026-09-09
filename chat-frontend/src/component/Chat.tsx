import { useEffect, useRef, useState } from "react";
import { Client, type IMessage } from "@stomp/stompjs";
import "./Chat.scss";
export interface ChatMessage {
  sender: string;
  content: string;
}
const Chat = () => {
  const [sender, setSender] = useState("");
  const [content, setContent] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [connected, setConnected] = useState(false);

  const clientRef = useRef<Client | null>(null);

  useEffect(() => {
    const client = new Client({
      brokerURL: "ws://localhost:8080/api/ws",

      reconnectDelay: 5000,

      onConnect: () => {
        console.log("WebSocket connected");

        setConnected(true);

        client.subscribe("/topic/messages", (message: IMessage) => {
          const data: ChatMessage = JSON.parse(message.body);

          setMessages((prev) => [...prev, data]);
        });
      },

      onDisconnect: () => {
        console.log("WebSocket disconnected");
        setConnected(false);
      },

      onStompError: (frame) => {
        console.error("STOMP Error:", frame.headers["message"]);
      },
    });

    client.activate();

    clientRef.current = client;

    return () => {
      client.deactivate();
    };
  }, []);

  const sendMessage = () => {
    if (!sender.trim() || !content.trim()) {
      return;
    }

    if (!clientRef.current?.connected) {
      alert("WebSocket is not connected");
      return;
    }

    const message: ChatMessage = {
      sender: sender.trim(),
      content: content.trim(),
    };

    clientRef.current.publish({
      destination: "/app/chat",
      body: JSON.stringify(message),
    });

    setContent("");
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      sendMessage();
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-12 col-md-8 col-lg-6">
          <div className="card shadow">
            {/* Header */}
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">💬 Chat Application</h5>

              <span
                className={`badge ${connected ? "bg-success" : "bg-danger"}`}
              >
                {connected ? "Connected" : "Disconnected"}
              </span>
            </div>

            {/* Messages */}
            <div className="card-body chat-body">
              {messages.length === 0 ? (
                <div className="text-center text-muted mt-5">No messages</div>
              ) : (
                messages.map((message, index) => (
                  <div className="message-wrapper" key={index}>
                    <div className="message-sender">{message.sender}</div>

                    <div className="message-content">{message.content}</div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="card-footer">
              <div className="mb-2">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Your name"
                  value={sender}
                  onChange={(e) => setSender(e.target.value)}
                />
              </div>

              <div className="input-group">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Type message..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  onKeyDown={handleKeyDown}
                />

                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={sendMessage}
                  disabled={!connected}
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
