import type { FeedMessageHandler, FeedWorker } from "../types";

function toMessagePayload(data: MessageEvent["data"]): Promise<string> {
  if (typeof data === "string") return Promise.resolve(data);
  if (data instanceof Blob) return data.text();
  if (data instanceof ArrayBuffer) return Promise.resolve(new TextDecoder().decode(data));

  return Promise.resolve(JSON.stringify(data));
}

export function createWebSocketFeed(wsUrl: string, onMessage: FeedMessageHandler): FeedWorker {
  let socket: WebSocket | null = null;

  function connect() {
    socket?.close();
    socket = new WebSocket(wsUrl);

    socket.addEventListener("open", () => {
      onMessage({ type: "STATUS", payload: "connected" });
    });

    socket.addEventListener("message", async (event) => {
      onMessage({ type: "MESSAGE", payload: await toMessagePayload(event.data) });
    });

    socket.addEventListener("error", () => {
      onMessage({ type: "STATUS", payload: "error" });
    });

    socket.addEventListener("close", () => {
      onMessage({ type: "STATUS", payload: "disconnected" });
    });
  }

  function send(payload: string) {
    if (WebSocket.OPEN === socket?.readyState) {
      socket.send(payload);
    }
  }

  function disconnect() {
    socket?.close(1000, "Client disconnected");
    socket = null;
  }

  return {
    postMessage(message) {
      if (message.type === "CONNECT") connect();
      if (message.type === "SEND") send(message.payload);
      if (message.type === "DISCONNECT") disconnect();
    },
    terminate() {
      disconnect();
    },
  };
}
