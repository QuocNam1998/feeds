import { Tag } from "./types";

export const DEFAULT_WS_URL = "ws://localhost:4001";

export const TAG: Tag = {
    price_update: { bg: "#0d2b1a", color: "#22c55e", label: "PRICE" },
    user_joined:  { bg: "#1a1a2e", color: "#818cf8", label: "USER"  },
    ping:         { bg: "#1c1008", color: "#f59e0b", label: "PING"  },
    echo:         { bg: "#1a0a0a", color: "#f87171", label: "ECHO"  },
    market_snapshot: { bg: "#082f49", color: "#38bdf8", label: "WORKER" },
};
