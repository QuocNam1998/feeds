import type { FeedEvent, MarketSnapshot, WorkerCommand } from "../types";



const ctx = self;
let socket: WebSocket | null = null;

function postStatus(payload: "connected" | "disconnected" | "error") {
  ctx.postMessage({ type: "STATUS", payload });
}

function postMessagePayload(payload: FeedEvent) {
  ctx.postMessage({ type: "MESSAGE", payload });
}

function toMessagePayload(data: MessageEvent["data"]): Promise<string> {
  if (typeof data === "string") return Promise.resolve(data);
  if (data instanceof Blob) return data.text();
  if (data instanceof ArrayBuffer) return Promise.resolve(new TextDecoder().decode(data));

  return Promise.resolve(JSON.stringify(data));
}

function summarizeMarketSnapshot(snapshot: MarketSnapshot): FeedEvent {
  let totalPrice = 0;
  let totalVolume = 0;
  let minPrice = Number.POSITIVE_INFINITY;
  let maxPrice = Number.NEGATIVE_INFINITY;

  for (const sample of snapshot.samples) {
    totalPrice += sample.price;
    totalVolume += sample.volume;
    minPrice = Math.min(minPrice, sample.price);
    maxPrice = Math.max(maxPrice, sample.price);
  }

  const averagePrice = totalPrice / snapshot.samples.length;
  let variance = 0;

  for (const sample of snapshot.samples) {
    variance += (sample.price - averagePrice) ** 2;
  }

  const volatility = Math.sqrt(variance / snapshot.samples.length);

  return {
    id: snapshot.id,
    type: "market_snapshot",
    symbol: "ALL",
    value: `${snapshot.samples.length.toLocaleString()} ticks | avg $${averagePrice.toFixed(2)} | min $${minPrice.toFixed(2)} | max $${maxPrice.toFixed(2)} | vol ${volatility.toFixed(2)} | qty ${Math.round(totalVolume).toLocaleString()}`,
    ts: snapshot.ts,
  };
}

function processPayload(payload: string) {
  const parsed = JSON.parse(payload) as FeedEvent | MarketSnapshot;

  if (parsed.type === "market_snapshot" && "samples" in parsed) {
    postMessagePayload(summarizeMarketSnapshot(parsed));
    return;
  }

  postMessagePayload(parsed);
}

function connect(wsUrl: string) {
  socket?.close();
  socket = new WebSocket(wsUrl);

  socket.addEventListener("open", () => {
    postStatus("connected");
  });

  socket.addEventListener("message", async (event) => {
    try {
      processPayload(await toMessagePayload(event.data));
    } catch {
      postMessagePayload({
        type: "raw",
        symbol: null,
        value: "Worker could not parse feed payload",
        ts: new Date().toISOString(),
      });
    }
  });

  socket.addEventListener("error", () => {
    postStatus("error");
  });

  socket.addEventListener("close", () => {
    postStatus("disconnected");
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

ctx.addEventListener("message", (event: MessageEvent<WorkerCommand>) => {
  const message = event.data;

  if (message.type === "CONNECT") connect(message.wsUrl);
  if (message.type === "SEND") send(message.payload);
  if (message.type === "DISCONNECT") disconnect();
});

export {};
