export type FeedStatus = "connected" | "disconnected" | "error";

export type WorkerConnectCommand = Extract<FeedCommand, { type: "CONNECT" }> & {
  wsUrl: string;
};

export type WorkerCommand = WorkerConnectCommand | Exclude<FeedCommand, { type: "CONNECT" }>;

export type MarketSample = {
  symbol: string;
  price: number;
  volume: number;
};

export type MarketSnapshot = {
  id: number;
  type: "market_snapshot";
  symbol: null;
  samples: MarketSample[];
  ts: string;
};
export type FeedMessage =
  | {
      type: "STATUS";
      payload: FeedStatus;
    }
  | {
      type: "MESSAGE";
      payload: FeedEvent;
    };

export type FeedCommand =
  | {
      type: "CONNECT";
    }
  | {
      type: "DISCONNECT";
    }
  | {
      type: "SEND";
      payload: string;
    };

export type FeedEventType = "price_update" | "user_joined" | "ping" | "echo" | "market_snapshot" | "raw";

export type FeedEvent = {
  id?: number;
  type: FeedEventType;
  symbol: string | null;
  value: string;
  ts: string;
};

export type FeedItem = FeedEvent & {
  _key: string;
};

export type FeedWorker = {
  postMessage: (message: FeedCommand) => void;
  terminate: () => void;
};

export type FeedMessageHandler = (message: FeedMessage) => void;

export type TagObj = { bg: string; color: string; label: string };
export type Tag = Record<string, TagObj>;
