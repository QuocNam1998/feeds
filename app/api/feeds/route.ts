import { NextResponse } from "next/server";

let msgCount = 0;

function randomEvent() {
  const r = Math.random();

  if (r < 0.45) return { type: "price_update", symbol: "BTC", value: (29000 + Math.random() * 2000).toFixed(2) };
  if (r < 0.8) return { type: "price_update", symbol: "ETH", value: (1800 + Math.random() * 200).toFixed(2) };
  if (r < 0.92) return { type: "user_joined", symbol: null, value: `User_${Math.floor(Math.random() * 9999)}` };

  return { type: "ping", symbol: null, value: "pong" };
}

function createFeedPayload(event: { type: string; symbol: string | null; value: string }) {
  return {
    id: ++msgCount,
    type: event.type,
    symbol: event.symbol,
    value: event.value,
    ts: new Date().toISOString(),
  };
}

export function GET() {
  return NextResponse.json(createFeedPayload(randomEvent()));
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const value = typeof body?.message === "string" ? body.message : "";

  return NextResponse.json(createFeedPayload({ type: "echo", symbol: null, value }));
}
