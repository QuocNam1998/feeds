import FeedsClient from "@/features/feeds/components/FeedsClient";
import { DEFAULT_WS_URL } from "@/features/feeds/datas";

export default function FeedsPage() {
  const wsUrl = process.env.FEED_WS_URL ?? process.env.NEXT_PUBLIC_FEED_WS_URL ?? DEFAULT_WS_URL;
  return <FeedsClient wsUrl={wsUrl} />;
}
