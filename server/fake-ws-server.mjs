import { createHash } from "node:crypto";
import { createServer } from "node:http";

const PORT = Number(process.env.WS_PORT ?? 4001);
const WS_MAGIC_GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";

const clients = new Set();
let feedTimer = null;
let msgCount = 0;

function randomEvent() {
  const r = Math.random();

  if (r < 0.6) return createMarketSnapshot();
  if (r < 0.78) return { type: "price_update", symbol: "BTC", value: (29000 + Math.random() * 2000).toFixed(2) };
  if (r < 0.9) return { type: "price_update", symbol: "ETH", value: (1800 + Math.random() * 200).toFixed(2) };
  if (r < 0.97) return { type: "user_joined", symbol: null, value: `User_${Math.floor(Math.random() * 9999)}` };

  return { type: "ping", symbol: null, value: "pong" };
}

function createMarketSnapshot() {
  const symbols = ["BTC", "ETH", "SOL", "BNB", "XRP"];
  const samples = Array.from({ length: 12000 }, (_, index) => {
    const symbol = symbols[index % symbols.length];
    const basePrice = symbol === "BTC" ? 30000 : symbol === "ETH" ? 1900 : symbol === "SOL" ? 120 : symbol === "BNB" ? 580 : 0.6;

    return {
      symbol,
      price: Number((basePrice + Math.sin(index / 17) * basePrice * 0.015 + Math.random() * basePrice * 0.01).toFixed(4)),
      volume: Number((10 + Math.random() * 250).toFixed(4)),
    };
  });

  return {
    type: "market_snapshot",
    symbol: null,
    samples,
  };
}

function createFeedPayload(event) {
  const payload = {
    id: ++msgCount,
    type: event.type,
    symbol: event.symbol,
    value: event.value,
    ts: new Date().toISOString(),
  };

  if (Array.isArray(event.samples)) {
    payload.samples = event.samples;
  }

  return JSON.stringify(payload);
}

function createAcceptKey(webSocketKey) {
  return createHash("sha1").update(webSocketKey + WS_MAGIC_GUID).digest("base64");
}

function encodeFrame(text) {
  const payload = Buffer.from(text);
  const payloadLength = payload.length;

  if (payloadLength < 126) {
    return Buffer.concat([Buffer.from([0x81, payloadLength]), payload]);
  }

  if (payloadLength < 65536) {
    const header = Buffer.alloc(4);
    header[0] = 0x81;
    header[1] = 126;
    header.writeUInt16BE(payloadLength, 2);
    return Buffer.concat([header, payload]);
  }

  const header = Buffer.alloc(10);
  header[0] = 0x81;
  header[1] = 127;
  header.writeBigUInt64BE(BigInt(payloadLength), 2);
  return Buffer.concat([header, payload]);
}

function decodeFrame(buffer) {
  const opcode = buffer[0] & 0x0f;
  const isMasked = Boolean(buffer[1] & 0x80);
  let payloadLength = buffer[1] & 0x7f;
  let offset = 2;

  if (payloadLength === 126) {
    payloadLength = buffer.readUInt16BE(offset);
    offset += 2;
  } else if (payloadLength === 127) {
    payloadLength = Number(buffer.readBigUInt64BE(offset));
    offset += 8;
  }

  if (opcode === 0x8) return { type: "close" };
  if (opcode !== 0x1 || !isMasked) return { type: "ignored" };

  const mask = buffer.subarray(offset, offset + 4);
  offset += 4;

  const payload = Buffer.alloc(payloadLength);
  for (let i = 0; i < payloadLength; i += 1) {
    payload[i] = buffer[offset + i] ^ mask[i % 4];
  }

  return { type: "text", text: payload.toString("utf8") };
}

function send(socket, text) {
  if (!socket.destroyed) {
    socket.write(encodeFrame(text));
  }
}

function broadcast(text) {
  for (const client of clients) {
    send(client, text);
  }
}

function startFeed() {
  if (feedTimer) return;

  feedTimer = setInterval(() => {
    broadcast(createFeedPayload(randomEvent()));
  }, 1500);
}

function stopFeed() {
  if (!feedTimer || clients.size > 0) return;

  clearInterval(feedTimer);
  feedTimer = null;
}

function removeClient(socket) {
  if (!clients.delete(socket)) return;

  console.log(`Client disconnected. Active clients: ${clients.size}`);
  stopFeed();
}

const server = createServer((_, response) => {
  response.writeHead(426, { "Content-Type": "text/plain" });
  response.end("This endpoint expects a WebSocket connection.\n");
});

server.on("upgrade", (request, socket) => {
  const webSocketKey = request.headers["sec-websocket-key"];

  if (typeof webSocketKey !== "string") {
    socket.destroy();
    return;
  }

  socket.write([
    "HTTP/1.1 101 Switching Protocols",
    "Upgrade: websocket",
    "Connection: Upgrade",
    `Sec-WebSocket-Accept: ${createAcceptKey(webSocketKey)}`,
    "",
    "",
  ].join("\r\n"));

  clients.add(socket);
  startFeed();
  console.log(`Client connected. Active clients: ${clients.size}`);

  socket.on("data", (buffer) => {
    const frame = decodeFrame(buffer);

    if (frame.type === "close") {
      socket.end();
      return;
    }

    if (frame.type === "text") {
      send(socket, createFeedPayload({ type: "echo", symbol: null, value: frame.text }));
    }
  });

  socket.on("close", () => {
    removeClient(socket);
  });

  socket.on("error", () => {
    removeClient(socket);
  });
});

server.listen(PORT, () => {
  console.log(`Fake WebSocket feed running at ws://localhost:${PORT}`);
});
