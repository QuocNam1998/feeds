import type { FeedCommand, FeedMessage, FeedMessageHandler, FeedWorker } from "../types";

export function createWebSocketFeed(wsUrl: string, onMessage: FeedMessageHandler): FeedWorker {
  const worker = new Worker(new URL("./webSocketFeedWorker.ts", import.meta.url), {
    type: "module",
  });

  worker.addEventListener("message", (event: MessageEvent<FeedMessage>) => {
    onMessage(event.data);
  });

  worker.addEventListener("error", () => {
    onMessage({ type: "STATUS", payload: "error" });
  });

  return {
    postMessage(message: FeedCommand) {
      worker.postMessage(message.type === "CONNECT" ? { ...message, wsUrl } : message);
    },
    terminate() {
      worker.postMessage({ type: "DISCONNECT" });
      worker.terminate();
    },
  };
}
