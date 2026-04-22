export type FeedStatus = "connected" | "disconnected" | "error";

export type FeedMessage =
  | {
      type: "STATUS";
      payload: FeedStatus;
    }
  | {
      type: "MESSAGE";
      payload: string;
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

export type FeedEventType = "price_update" | "user_joined" | "ping" | "echo" | "raw";

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
