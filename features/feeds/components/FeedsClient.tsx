"use client";

import FeedsButton from "@/features/feeds/components/FeedsButton";
import { TAG } from "@/features/feeds/datas";
import { createWebSocketFeed } from "@/features/feeds/services/webSocketFeed";
import type { FeedEvent, FeedItem, FeedMessage, FeedStatus, FeedWorker } from "@/features/feeds/types";
import { useEffect, useRef, useState } from "react";

type FeedsClientProps = {
  wsUrl: string;
};

function FeedsClient({ wsUrl }: FeedsClientProps) {
  const workerRef = useRef<FeedWorker | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [status, setStatus] = useState<FeedStatus>("disconnected");
  const [messages, setMessages] = useState<FeedItem[]>([]);
  const [input, setInput] = useState("");

  useEffect(() => () => workerRef.current?.terminate(), []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const connect = () => {
    workerRef.current?.terminate();
    const worker = createWebSocketFeed(wsUrl, (msg: FeedMessage) => {
      if (msg.type === "STATUS") setStatus(msg.payload);
      if (msg.type === "MESSAGE") {
        try {
          const parsed = JSON.parse(msg.payload) as FeedEvent;
          setMessages((prev) => [...prev.slice(-49), { ...parsed, _key: `${Date.now()}-${Math.random()}` }]);
        } catch {
          setMessages((prev) => [...prev.slice(-49), { _key: `${Date.now()}`, type: "raw", symbol: null, value: msg.payload, ts: new Date().toISOString() }]);
        }
      }
    });
    worker.postMessage({ type: "CONNECT" });
    workerRef.current = worker;
  };

  const disconnect = () => {
    workerRef.current?.postMessage({ type: "DISCONNECT" });
    workerRef.current?.terminate();
    workerRef.current = null;
  };

  const sendMessage = () => {
    if (!input.trim()) return;
    workerRef.current?.postMessage({ type: "SEND", payload: input.trim() });
    setInput("");
    inputRef.current?.focus();
  };

  const isConnected = status === "connected";

  return (
    <div className="feeds-page">

      {/* Header */}
      <div className="feeds-header">
        <div>
          <div className="feeds-eyebrow">REAL WEBSOCKET</div>
          <div className="feeds-title">WebSocket Feed</div>
        </div>
        <div className="feeds-status">
          <span className={`feeds-status-dot feeds-status-dot--${status}`} />
          <span className={`feeds-status-label feeds-status-label--${status}`}>
            {status.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Architecture */}
      <div className="feeds-architecture">
        <span className="feeds-architecture-source">Server Component</span>
        <span className="feeds-architecture-client">Client Component</span>
        <span className="feeds-architecture-server">{wsUrl}</span>
      </div>

      {/* Controls */}
      <div className="feeds-controls">
        <FeedsButton label="CONNECT" onClick={connect} disabled={isConnected} active={!isConnected} />
        <FeedsButton label="DISCONNECT" onClick={disconnect} disabled={!isConnected} active={isConnected} />
        <button className="feeds-clear-button" onClick={() => setMessages([])}>CLEAR</button>
      </div>

      {/* Feed */}
      <div className="feeds-panel">
        <div className="feeds-panel-header">
          <span>LIVE FEED</span>
          <span>{messages.length} msgs</span>
        </div>
        <div className="feeds-list">
          {messages.length === 0 && (
            <div className="feeds-empty">
              Press CONNECT to open the WebSocket
            </div>
          )}
          {messages.map((msg) => {
            const tag = TAG[msg?.type] || { bg: "#111", color: "#94a3b8", label: (msg?.type || "RAW").toUpperCase() };
            return (
              <div key={msg._key} className="feeds-row">
                <span className="feeds-time">
                  {new Date(msg.ts).toLocaleTimeString([], { hour12: false })}
                </span>
                <span className={`feeds-tag feeds-tag--${msg.type}`}>
                  {tag.label}
                </span>
                {msg.symbol && <span className="feeds-symbol">{msg.symbol}</span>}
                <span className="feeds-value">{msg.value}</span>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Send */}
      <div className="feeds-send">
        <input
          className="feeds-input"
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Type a message to send through the WebSocket..."
          disabled={!isConnected}
        />
        <button className="feeds-send-button" onClick={sendMessage} disabled={!isConnected}>SEND</button>
      </div>
    </div>
  );
}

export default FeedsClient;
